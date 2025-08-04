use std::process::{Command, Stdio};
use std::time::Duration;
use tauri::{Manager, AppHandle, State};
use std::sync::{Arc, Mutex};
use log::{info, error};
use dirs;

struct NodeServer {
    process: Arc<Mutex<Option<std::process::Child>>>,
}

impl NodeServer {
    fn new() -> Self {
        Self {
            process: Arc::new(Mutex::new(None)),
        }
    }

    fn start(&self, app_handle: &AppHandle) -> Result<(), String> {
        let mut process_guard = self.process.lock().unwrap();
        
        if process_guard.is_some() {
            return Ok(()); // Already running
        }

        // Get the resource path for the Node.js server
        let resource_path = app_handle.path().resource_dir()
            .map_err(|e| format!("Failed to get resource directory: {}", e))?;
        
        info!("Starting Node.js server from: {:?}", resource_path);

        // Set up environment variables for the Node.js process
        let mut cmd = Command::new("node");
        cmd.arg("dist/server.js")
           .current_dir(&resource_path)
           .stdout(Stdio::piped())
           .stderr(Stdio::piped())
           .env("PORT", "3000")
           .env("NODE_ENV", "production");

        // Set up data directory for SQLite database
        if let Some(data_dir) = dirs::data_dir() {
            let app_data_dir = data_dir.join("api-proxy");
            std::fs::create_dir_all(&app_data_dir).ok();
            cmd.env("DATABASE_PATH", app_data_dir.join("api-proxy.db"));
        }

        match cmd.spawn() {
            Ok(child) => {
                info!("Node.js server started successfully with PID: {}", child.id());
                *process_guard = Some(child);
                Ok(())
            },
            Err(e) => {
                error!("Failed to start Node.js server: {}", e);
                Err(format!("Failed to start Node.js server: {}", e))
            }
        }
    }

    fn stop(&self) {
        let mut process_guard = self.process.lock().unwrap();
        if let Some(mut process) = process_guard.take() {
            info!("Stopping Node.js server...");
            if let Err(e) = process.kill() {
                error!("Failed to kill Node.js process: {}", e);
            } else {
                info!("Node.js server stopped successfully");
            }
        }
    }
}

impl Drop for NodeServer {
    fn drop(&mut self) {
        self.stop();
    }
}

#[tauri::command]
async fn check_server_status() -> Result<bool, String> {
    // Simple check to see if the server is responding
    match tokio::time::timeout(
        Duration::from_secs(5),
        reqwest::get("http://localhost:3000/api/health")
    ).await {
        Ok(Ok(response)) => Ok(response.status().is_success()),
        Ok(Err(_)) => Ok(false),
        Err(_) => Ok(false), // Timeout
    }
}

#[tauri::command]
async fn restart_server(app_handle: AppHandle, node_server: State<'_, NodeServer>) -> Result<(), String> {
    info!("Restarting Node.js server...");
    node_server.stop();
    tokio::time::sleep(Duration::from_secs(2)).await;
    node_server.start(&app_handle)?;
    
    // Wait a bit for the server to start
    tokio::time::sleep(Duration::from_secs(3)).await;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let node_server = NodeServer::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default()
            .level(if cfg!(debug_assertions) { 
                log::LevelFilter::Debug 
            } else { 
                log::LevelFilter::Info 
            })
            .build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(node_server)
        .setup(|app| {
            let app_handle = app.handle().clone();
            let node_server = app.state::<NodeServer>();
            
            info!("Setting up Tauri application...");
            
            // Start the Node.js server
            if let Err(e) = node_server.start(&app_handle) {
                error!("Failed to start Node.js server during setup: {}", e);
                return Err(Box::new(std::io::Error::new(
                    std::io::ErrorKind::Other,
                    format!("Failed to start Node.js server: {}", e)
                )));
            }

            // Wait a moment for the server to start
            std::thread::sleep(Duration::from_secs(3));
            
            info!("Tauri application setup completed");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![check_server_status, restart_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
