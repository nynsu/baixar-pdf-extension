# Privacy Policy for Download PDF Chrome Extension

**Last Updated:** November 7, 2026

"Download PDF" is a browser extension developed to provide margin cropping and downloading capabilities for web-based PDF viewers (Mozilla PDF.js).

### 1. Data Collection and Usage
"Download PDF" **does not collect, store, transmit, or sell any personal information or user data**. 

- **No Personal Data:** We do not collect names, email addresses, IP addresses, credentials, or browsing history.
- **No Document Data Transmitted:** All PDF document processing, margin cropping, rendering, and downloading take place **100% locally** within your browser's active memory. No documents or page contents are ever transmitted to any external server or cloud service.
- **Local Settings:** The extension uses `chrome.storage.local` exclusively to store a local preference boolean (light/dark theme state) on your own device.

### 2. Permissions
- **activeTab:** Used solely to interact with the current tab when the user explicitly clicks the extension icon.
- **scripting:** Used solely to inject the crop interface and local `pdf-lib` utility into the active tab.
- **storage:** Used to remember light/dark icon preference locally on the device.
- **Content Scripts (`<all_urls>`):** Used solely to detect changes in system color theme (`prefers-color-scheme`) to adapt the extension icon dynamically. It does not monitor, log, or inspect web content.

### 3. Third-Party Sharing
We do not sell, rent, or transfer any user data to third parties.

### 4. Contact
For any questions regarding this Privacy Policy, you can open an issue on the official GitHub repository:
https://github.com/nynsu/baixar-pdf-extension
