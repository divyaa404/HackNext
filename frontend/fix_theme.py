import os
import glob

directory = 'src/pages/participant'
files = glob.glob(os.path.join(directory, '*.tsx'))

replacements = {
    'bg-white': 'bg-bauhaus-card',
    'text-black': 'text-bauhaus-text',
    'border-black': 'border-bauhaus-border',
    'shadow-[4px_4px_0px_rgba(0,0,0,1)]': 'shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(255,255,255,0.2)]',
    'shadow-[2px_2px_0px_rgba(0,0,0,1)]': 'shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_rgba(255,255,255,0.2)]',
    'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]': 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]',
    'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]': 'shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]',
    'bg-gray-200': 'bg-gray-200 dark:bg-gray-800',
    'bg-gray-100': 'bg-gray-100 dark:bg-gray-800',
    'text-gray-500': 'text-gray-500 dark:text-gray-400',
    'text-gray-600': 'text-gray-600 dark:text-gray-300',
    'text-gray-700': 'text-gray-700 dark:text-gray-300',
    'text-gray-800': 'text-gray-800 dark:text-gray-200',
    'bg-bauhaus-primary text-white p-8': 'bg-bauhaus-primary text-white p-8', # keep
}

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Replaced classes for dark mode support.")
