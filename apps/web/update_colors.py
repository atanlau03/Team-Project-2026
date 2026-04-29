import json
import re

config_path = r'd:\project SE\apps\web\tailwind.config.js'
with open(config_path, 'r', encoding='utf-8') as f:
    config = f.read()

# Extract colors dict
match = re.search(r'colors:\s*(\{.*?\})', config, re.DOTALL)
if not match:
    print("Could not find colors section")
    exit(1)

colors_str = match.group(1)
# Make it valid JSON for easy parsing (some keys have quotes, some don't, but here all seem to have string keys)
# Actually, tailwind.config.js colors are valid json inside the brackets.
# Let's fix missing quotes if any, just in case, or use simple regex extract
colors = {}
for line in colors_str.split('\n'):
    line = line.strip()
    if ':' in line:
        key, val = line.split(':', 1)
        key = key.strip().replace('"', '').replace("'", '')
        val = val.strip().replace('"', '').replace("'", '').replace(',', '')
        if key and val and val.startswith('#'):
            colors[key] = val

root_vars = []
dark_vars = []
new_colors = []

# Simple dark mode inversion logic:
# dark surface: #1d1b18, dark background: #1d1b18
# on-surface: #fef9f2 ...
for k, v in colors.items():
    root_vars.append(f"    --color-{k}: {v};")
    new_colors.append(f'        "{k}": "var(--color-{k})",')
    
    # generate dark mode val
    dark_v = v
    if k in ['surface', 'background', 'surface-bright', 'surface-container-lowest']:
        dark_v = '#1d1b18' # Very dark brown/black
    elif k in ['on-surface', 'on-background']:
        dark_v = '#fef9f2'
    elif k in ['surface-container-low', 'surface-container']:
        dark_v = '#2a2622'
    elif k in ['surface-container-high', 'surface-container-highest']:
        dark_v = '#35302b'
    elif k in ['outline-variant']:
        dark_v = '#4f453e' 
    elif k in ['outline']:
        dark_v = '#a1958d' 
    elif 'gradient' in k or k == 'primary':
        dark_v = '#e5bfa5' # Light primary
    elif k == 'on-primary':
        dark_v = '#2b1706'
    elif k == 'primary-container':
        dark_v = '#5c412d'
    elif k == 'on-primary-container':
        dark_v = '#ffdcc4'
    else:
        # fallback simple string invert just keeping it same for now if unmapped
        pass
    
    dark_vars.append(f"    --color-{k}: {dark_v};")

# Write to tailwind config
new_colors_str = "colors: {\n" + "\n".join(new_colors) + "\n      }"
new_config = config.replace(match.group(0), new_colors_str)
with open(config_path, 'w', encoding='utf-8') as f:
    f.write(new_config)

# Update index.css
css_path = r'd:\project SE\apps\web\src\index.css'
with open(css_path, 'r', encoding='utf-8') as f:
    css = f.read()

variables_block = ":root {\n" + "\n".join(root_vars) + "\n  }\n  .dark {\n" + "\n".join(dark_vars) + "\n  }\n"

new_css = css.replace('@layer base {\n', '@layer base {\n  ' + variables_block)
with open(css_path, 'w', encoding='utf-8') as f:
    f.write(new_css)

print("Colors updated in both files successfully.")
