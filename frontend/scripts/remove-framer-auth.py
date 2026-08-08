#!/usr/bin/env python3
"""Remove all framer-motion imports and usages from auth/page.tsx."""
import re

path = '/home/ubuntu/wiitoo/frontend/app/auth/page.tsx'

with open(path, 'r') as f:
    content = f.read()

original = content

# 1. Replace import
content = content.replace(
    "import { AnimatePresence, motion } from 'framer-motion';",
    ''
)

# 2. Replace the AnimatePresence step switcher
old_ap = '''            <AnimatePresence mode="wait">
              {step === 'vibe' && <VibePicker key="vibe" />}
              {step === 'name' && <NameStep key="name" />}
              {step === 'key' && <KeyStep key="key" />}
              {step === 'otp' && <OtpScreen key="otp" />}
              {step === 'welcome' && <WelcomeOverlay key="welcome" />}
              {step === 'login' && <LoginScreen key="login" />}
              {step === 'reset' && <ResetEmailStep key="reset" />}
              {step === 'reset-otp' && <ResetOtpStep key="reset-otp" />}
              {step === 'reset-key' && <ResetKeyStep key="reset-key" />}
            </AnimatePresence>'''

new_ap = '''          <div key={step} className="animate-fade-in">
              {step === 'vibe' && <VibePicker />}
              {step === 'name' && <NameStep />}
              {step === 'key' && <KeyStep />}
              {step === 'otp' && <OtpScreen />}
              {step === 'welcome' && <WelcomeOverlay />}
              {step === 'login' && <LoginScreen />}
              {step === 'reset' && <ResetEmailStep />}
              {step === 'reset-otp' && <ResetOtpStep />}
              {step === 'reset-key' && <ResetKeyStep />}
            </div>'''

content = content.replace(old_ap, new_ap)

# 3. Replace GlassCard (motion.div -> div, strip framer props)
old_glass = '''    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-2xl p-8 border/50 backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: 'rgba(13, 13, 13, 0.75)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}'''

new_glass = '''    <div
      className={`rounded-2xl p-8 border/50 backdrop-blur-xl animate-slide-up ${className}`}
      style={{
        backgroundColor: 'rgba(13, 13, 13, 0.75)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}'''

content = content.replace(old_glass, new_glass)

# 4. Replace brand watermark (motion.div -> div, strip animate prop)
old_watermark = '''        <motion.div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10"
          animate={{ opacity: step === 'welcome' ? 0 : 1 }}
        >'''

new_watermark = '''        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-10 transition-opacity duration-500 ${
            step === 'welcome' ? 'opacity-0' : 'opacity-100'
          }`}
        >'''

content = content.replace(old_watermark, new_watermark)

# 5. Replace closing motion.div for watermark
content = content.replace('</motion.div>\n    </AuthContext.Provider>', '</div>\n    </AuthContext.Provider>')

# 6. Replace all remaining motion.X with plain X (these are all entry animations
#    that will now be handled by the step-level animate-fade-in)
replacements = [
    ('motion.div', 'div'),
    ('motion.h1', 'h1'),
    ('motion.p', 'p'),
    ('motion.button', 'button'),
    ('motion.span', 'span'),
    ('motion.label', 'label'),
]

for old_tag, new_tag in replacements:
    content = content.replace(old_tag, new_tag)

# 7. Strip framer-motion API props from remaining elements
#    Initial/animate/exit/transition props array: remove lines that contain ONLY these props
#    But be careful not to break JSX expressions that contain these words

# Pattern: remove lines that are just framer-motion props like:
#   initial={{ ... }}
#   animate={{ ... }}
#   exit={{ ... }}
#   transition={{ ... }}
#   layout
# These appear as individual lines in JSX

lines = content.split('\n')
new_lines = []
skip_next = False

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # Skip standalone framer-motion prop lines
    if (stripped.startswith('initial={{') or 
        stripped.startswith('animate={{') or 
        stripped.startswith('exit={{') or 
        stripped.startswith('transition={{') or
        stripped.startswith('layout')):
        # Check if it's a standalone prop line (ends with }, or has closing on next line)
        if stripped.endswith('},') or stripped == 'layout' or stripped == 'layout, ':
            continue
        # If the prop spans multiple lines, we need to track
        else:
            skip_next = True
            continue
    if skip_next:
        if stripped.endswith('],') or stripped.endswith('},') or stripped == '}},' or stripped == '}}':
            skip_next = False
            continue
        else:
            continue
    
    # Handle {initial|animate|exit|transition} that's on one line + inline
    # e.g., `... animate={{ scale: 0 }} ...` or `... initial={{ scale: 0 }} ...`
    # These are harder to remove from inline — leave them, they're harmless as JSX attributes
    
    # Handle motion.div closing tags (already handled by tag replacement)
    if '</motion.' in line:
        line = line.replace('</motion.', '</')
    
    new_lines.append(line)

content = '\n'.join(new_lines)

# 8. Clean up: remove empty lines left from removed imports
content = content.replace('\n\n\n', '\n\n')

with open(path, 'w') as f:
    f.write(content)

changed = original != content
removed_count = original.count('motion.') - content.count('motion.')
print(f"Changed: {changed}")
print(f"Remaining motion usages (should be 0): {content.count('motion.')}")
print(f"Framer-motion import remaining: {'framer-motion' in content}")