#!/usr/bin/env python3
import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.join(BASE_DIR, 'dist')
INDEX_PATH = os.path.join(BASE_DIR, 'index.html')
OUTPUT_PATH = os.path.join(DIST_DIR, 'HardwarePM.html')

def inline_file(html_content, tag, file_path, wrapper):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        return html_content.replace(tag, wrapper(content))
    else:
        print(f"Warning: {file_path} not found — '{tag}' left unresolved.")
        return html_content

def bundle():
    print("Bundling Project Management web app into single standalone HTML file...")
    os.makedirs(DIST_DIR, exist_ok=True)

    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        html_content = f.read()

    # 1. Inline Tailwind CSS
    html_content = inline_file(
        html_content,
        '<link rel="stylesheet" href="css/tailwind.css">',
        os.path.join(BASE_DIR, 'css', 'tailwind.css'),
        lambda c: f'<style>\n{c}\n</style>'
    )

    # 2. Inline custom styles.css
    html_content = inline_file(
        html_content,
        '<link rel="stylesheet" href="css/styles.css">',
        os.path.join(BASE_DIR, 'css', 'styles.css'),
        lambda c: f'<style>\n{c}\n</style>'
    )

    # 3. Inline xlsx vendor library
    html_content = inline_file(
        html_content,
        '<script src="js/vendor/xlsx.full.min.js"></script>',
        os.path.join(BASE_DIR, 'js', 'vendor', 'xlsx.full.min.js'),
        lambda c: f'<script>\n{c}\n</script>'
    )

    # 4. Inline fonts as base64 (so @font-face url() references resolve)
    import base64
    fonts_dir = os.path.join(BASE_DIR, 'fonts')
    if os.path.isdir(fonts_dir):
        for fname in os.listdir(fonts_dir):
            if fname.endswith('.woff2'):
                with open(os.path.join(fonts_dir, fname), 'rb') as f:
                    b64 = base64.b64encode(f.read()).decode('ascii')
                data_uri = f'data:font/woff2;base64,{b64}'
                html_content = html_content.replace(f'../fonts/{fname}', data_uri)

    # 5. Bundle JS Modules in Topological Dependency Order
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
    missing = []
    for relative_path in js_files:
        full_path = os.path.join(BASE_DIR, relative_path)
        if os.path.exists(full_path):
            with open(full_path, 'r', encoding='utf-8') as f:
                code = f.read()
            code = re.sub(r'import\s+.*?from\s+[\'"].*?[\'"];?', '', code)
            code = re.sub(r'export\s+class\s+', 'class ', code)
            code = re.sub(r'export\s+const\s+', 'const ', code)
            code = re.sub(r'export\s+default\s+', '', code)
            code = re.sub(r'export\s+function\s+', 'function ', code)
            bundled_js_parts.append(f"// --- Module: {relative_path} ---\n{code}\n")
        else:
            missing.append(relative_path)

    if missing:
        print("ERROR: missing JS module files, aborting build:")
        for m in missing:
            print(f"  - {m}")
        return

    combined_js = "\n".join(bundled_js_parts)

    target_script = '<script src="js/app.bundle.js"></script>'
    if target_script in html_content:
        html_content = html_content.replace(target_script, f'<script>\n{combined_js}\n</script>')
    else:
        print("ERROR: target script tag not found in index.html — build aborted, dist file NOT written correctly.")
        return

    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Successfully generated single-file standalone app at: {OUTPUT_PATH}")

if __name__ == '__main__':
    bundle()