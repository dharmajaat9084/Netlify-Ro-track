# RO-Track: Rental Management

> [!DANGER]
> **STOP! READ THIS! YOUR DEPLOYMENT WILL FAIL IF YOU IGNORE THIS!**
> 
> You **MUST** delete the `functions` directory from this project before deploying to Netlify.
> 
> Netlify's build system sees the `package.json` file inside that unused folder and incorrectly tries to run a full Node.js installation process. This is the root cause of all build failures.
>
> **Solution: DELETE THE ENTIRE `functions` DIRECTORY.**
>
> This is not optional. The `netlify.toml` file is a workaround, but deleting the `functions` directory is the real fix.

A simple, mobile-friendly web application designed to replace physical record cards for managing RO rental customers. It allows for digital tracking of customer details, monthly payments, and service history.

## How to Run

This project uses a modern, build-less setup. There is **no `npm install` or build step required**.

Dependencies like React and Firebase are loaded directly in the browser from a CDN via an `importmap` in the `index.html` file.

To run the application locally, you just need to serve the files with a simple static file server.

## How to Deploy

### Netlify

This repository is configured for seamless deployment to Netlify.

1.  **CRITICAL STEP:** First, **delete the unused `functions` directory** from your project.
2.  Create a "New site from Git" on Netlify and choose this repository.
3.  Netlify will automatically detect the `netlify.toml` file. This file configures the deployment correctly:
    - It tells Netlify that **no build command is necessary**.
    - It sets a **stable Node.js version** for the build environment to prevent errors with Netlify's default settings.
4.  Simply click "Deploy site".

**Important:** After deploying, you must add your Netlify site URL (e.g., `your-app.netlify.app`) to the **Authorized domains** list in your Firebase Authentication settings for login to work correctly.

## Deprecated `functions` Directory
This project contains a `functions` folder. This holds code for a deprecated feature and is no longer used. **You must delete this directory.** Keeping it will cause deployment failures on platforms like Netlify.

## Features
- Customer Management (Add, Edit, Delete)
- Detailed Customer Profiles
- Yearly Payment Tracking Grid
- Bulk Payment Updates
- Automated Daily Reminder Generation (Client-Side)
- English & Hindi Reminder Templates
- WhatsApp & SMS Integration
- Bulk Customer Import from CSV
- Export All Customers to CSV
- Voice-powered Search
- Dark Mode
- Guest Mode for Offline/Local-only Use
- Firebase integration for Cloud Sync (Optional)

## Firebase Setup (Optional)

To enable cloud data synchronization across devices, you need to configure Firebase:

1.  Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  In your project, create a Web App.
3.  Navigate to Project Settings > General, and find your Firebase SDK setup snippet.
4.  Copy the `firebaseConfig` object.
5.  Open the `firebaseConfig.ts` file in this project.
6.  Paste your configuration object, replacing the placeholder values.

If Firebase is not configured, the app will run in "Guest Mode" by default. In this mode, all data is stored locally in your browser's storage and will not be synced.
