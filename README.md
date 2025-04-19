# Child Safety Filter Extension

## Overview
A Chrome extension that protects children from inappropriate online content by blocking pages containing explicit keywords related to sexual content, violence, and drugs. Uses keyword filtering and machine learning via Hugging Face's API.

## Features
- Real-time content monitoring
- Comprehensive keyword filtering
- Whitelisting for educational content
- Easy toggle on/off functionality
- Visual blocking with full-screen overlay
- Performance optimized with caching

## Installation
1. Download the extension files
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder

## Configuration
1. Get a Hugging Face API key from [huggingface.co](https://huggingface.co/)
2. Replace in `background.js`:
   ```javascript
   const HUGGING_FACE_API_KEY = "your_api_key_here";

## Files
background.js - Core functionality
content.js - Content scanning
manifest.json - Extension config
popup.* - Popup interface

## Usage
- Click extension icon
- Toggle the switch to enable/disable
- Blocking happens automatically when enabled

## Privacy
- All processing happens locally
- Only communicates with Hugging Face API
- No user data collectio
