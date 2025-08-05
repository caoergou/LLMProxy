#!/usr/bin/env python3
"""
Test script to validate the GitHub Pages static site structure
"""

import os
import sys
from pathlib import Path

def test_file_exists(file_path, description):
    """Test if a file exists and report the result"""
    if os.path.exists(file_path):
        print(f"✅ {description}: {file_path}")
        return True
    else:
        print(f"❌ {description}: {file_path} - NOT FOUND")
        return False

def test_file_not_empty(file_path, description):
    """Test if a file exists and is not empty"""
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        print(f"✅ {description}: {file_path} ({os.path.getsize(file_path)} bytes)")
        return True
    else:
        print(f"❌ {description}: {file_path} - EMPTY OR NOT FOUND")
        return False

def test_html_content(file_path):
    """Test if HTML file has required content"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        required_elements = [
            ('<!DOCTYPE html>', 'HTML5 doctype'),
            ('<html', 'HTML tag'),
            ('<head>', 'Head section'),
            ('<title', 'Title tag'),
            ('assets/css/landing.css', 'CSS link'),
            ('assets/js/landing.js', 'JavaScript link'),
            ('LLM Proxy', 'Project name in content')
        ]
        
        all_good = True
        for element, description in required_elements:
            if element in content:
                print(f"✅ HTML content - {description}: Found")
            else:
                print(f"❌ HTML content - {description}: NOT FOUND")
                all_good = False
        
        return all_good
    except Exception as e:
        print(f"❌ Error reading HTML file: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Testing GitHub Pages static site structure...")
    print("=" * 50)
    
    # Set working directory to the repository root
    repo_root = Path(__file__).parent.parent
    os.chdir(repo_root)
    
    all_tests_passed = True
    
    # Test essential files exist
    print("\n📁 Testing file existence:")
    files_to_test = [
        ("index.html", "Main landing page"),
        ("assets/css/landing.css", "Main CSS file"),
        ("assets/js/landing.js", "Main JavaScript file"),
        ("assets/js/i18n.js", "Internationalization JavaScript"),
        ("docs/UNIFIED_API.md", "API documentation"),
        (".github/workflows/pages.yml", "GitHub Pages workflow"),
        (".github/workflows/update-gh-pages.yml", "Update workflow"),
        ("scripts/setup-gh-pages.sh", "Setup script"),
        ("docs/GITHUB_PAGES_SETUP.md", "Setup documentation")
    ]
    
    for file_path, description in files_to_test:
        if not test_file_exists(file_path, description):
            all_tests_passed = False
    
    # Test file sizes (non-empty)
    print("\n📏 Testing file content:")
    content_files = [
        ("index.html", "Landing page content"),
        ("assets/css/landing.css", "CSS content"),
        ("assets/js/landing.js", "JavaScript content")
    ]
    
    for file_path, description in content_files:
        if not test_file_not_empty(file_path, description):
            all_tests_passed = False
    
    # Test HTML structure
    print("\n🔍 Testing HTML structure:")
    if not test_html_content("index.html"):
        all_tests_passed = False
    
    # Test directory structure for gh-pages
    print("\n📂 Testing directory structure for gh-pages compatibility:")
    required_dirs = ["assets", "docs", "assets/css", "assets/js"]
    for dir_path in required_dirs:
        if os.path.isdir(dir_path):
            print(f"✅ Directory exists: {dir_path}")
        else:
            print(f"❌ Directory missing: {dir_path}")
            all_tests_passed = False
    
    # Summary
    print("\n" + "=" * 50)
    if all_tests_passed:
        print("🎉 All tests passed! The static site structure is ready for GitHub Pages.")
        print("\nNext steps:")
        print("1. Run ./scripts/setup-gh-pages.sh to create the gh-pages branch")
        print("2. Configure GitHub Pages to use the gh-pages branch")
        print("3. Your site will be available at: https://caoergou.github.io/LLMProxy/")
        return 0
    else:
        print("❌ Some tests failed. Please fix the issues before deploying.")
        return 1

if __name__ == "__main__":
    sys.exit(main())