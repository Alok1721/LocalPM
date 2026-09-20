#!/usr/bin/env python3
"""
Single-File Production Bundler Script for Project Management Tool.
Compiles modular HTML, CSS, and JavaScript into a single, standalone 'dist/HardwarePM.html' file.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
INDEX_PATH = os.path.join(BASE_DIR, 'index.html')
OUTPUT_PATH = os.path.join(DIST_DIR, 'HardwarePM.html')

def bundle():
    print("Bundling Project Management web app into single standalone HTML file...")
    
    if not os.path.exists(DIST_DIR):
        os.makedirs(DIST_DIR)

    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 1. Inline CSS Styles
    css_path = os.path.join(BASE_DIR, 'css', 'styles.css')
    if os.path.exists(css_path):
        with open(css_path, 'r', encoding='utf-8') as f:
            css_code = f.read()
        html_content = html_content.replace(
            '<link rel="stylesheet" href="css/styles.css">',
            f'<style>\n{css_code}\n</style>'
        )

    # 2. Bundle JS Modules in Topological Dependency Order
    js_files = [
        'js/models/taskModel.js',
        'js/models/resourceModel.js',
        'js/models/calendarModel.js',
        'js/engine/calendarEngine.js',
        'js/engine/dependencyEngine.js',
        'js/engine/baselineEngine.js',
        'js/views/wbsGridView.js',
        'js/views/ganttView.js',
        'js/views/milestonesView.js',
        'js/views/resourceView.js',
        'js/views/calendarModalView.js',
        'js/views/dependencyTreeView.js',
        'js/views/infoGuideView.js',
        'js/storage/projectStore.js',
        'js/export/excelExporter.js',
        'js/export/printEngine.js',
        'js/app.js'
    ]

    bundled_js_parts = []
    for relative_path in js_files:
        full_path = os.path.join(BASE_DIR, relative_path)
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as f:
                code = f.read()
                
            # Strip import statements
            code = re.sub(r'import\s+.*?from\s+[\'"].*?[\'"];?', '', code)
            
            # Strip export keywords
            code = re.sub(r'export\s+class\s+', 'class ', code)
            code = re.sub(r'export\s+const\s+', 'const ', code)
            code = re.sub(r'export\s+default\s+', '', code)
            code = re.sub(r'export\s+function\s+', 'function ', code)
            
            bundled_js_parts.append(f"// --- Module: {relative_path} ---\n{code}\n")

    combined_js = "\n".join(bundled_js_parts)

    target_script = '<script type="module" src="js/app.js"></script>'
    if target_script in html_content:
        html_content = html_content.replace(target_script, f'<script>\n{combined_js}\n</script>')
    else:
        print("Warning: target script tag not found in index.html")

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Successfully generated single-file standalone app at: {OUTPUT_PATH}")

if __name__ == '__main__':
    bundle()
