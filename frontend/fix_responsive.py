import os
import glob

directory = 'src/pages/participant'
files = glob.glob(os.path.join(directory, '*.tsx'))

replacements = {
    'className="p-8 max-w-': 'className="p-4 md:p-8 max-w-',
    'className="p-8 text-center': 'className="p-4 md:p-8 text-center',
    'className="bauhaus-card p-10': 'className="bauhaus-card p-6 md:p-10',
    'className="bauhaus-card p-8': 'className="bauhaus-card p-4 md:p-8',
    'className="bauhaus-card bg-bauhaus-card p-8': 'className="bauhaus-card bg-bauhaus-card p-4 md:p-8',
    'className="bauhaus-card bg-bauhaus-primary text-white p-8': 'className="bauhaus-card bg-bauhaus-primary text-white p-6 md:p-8',
    'className="bauhaus-card bg-bauhaus-accent p-8': 'className="bauhaus-card bg-bauhaus-accent p-6 md:p-8',
    'className="text-4xl font-black': 'className="text-3xl md:text-4xl font-black',
    'className="text-5xl font-black': 'className="text-3xl md:text-5xl font-black',
    'className="grid grid-cols-1 md:grid-cols-2 gap-8"': 'className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8"',
    'className="grid grid-cols-1 lg:grid-cols-3 gap-8"': 'className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8"',
    'className="bg-bauhaus-primary px-8 py-10"': 'className="bg-bauhaus-primary px-4 py-6 md:px-8 md:py-10"',
    'className="flex flex-col md:flex-row gap-6': 'className="flex flex-col md:flex-row gap-4 md:gap-6',
    'className="p-8 space-y-8': 'className="p-4 md:p-8 space-y-6 md:space-y-8',
    'className="text-3xl font-black': 'className="text-2xl md:text-3xl font-black',
    'className="w-full px-4 py-4': 'className="w-full px-4 py-3 md:py-4',
}

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Improved responsive UI.")
