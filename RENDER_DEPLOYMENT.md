# Render Deployment Guide

Render is an excellent platform that can host both your **Python Backend** and **Next.js Frontend** simultaneously!

To make this extremely easy, I have created a `render.yaml` (Blueprint) file in your project folder. This file tells Render exactly how to build and run both parts of your application and link them together.

## How to Deploy (The 1-Click Method):

1. **Commit and Push:**
   Make sure you have pushed all your latest code (including the `render.yaml` file) to your GitHub repository.

2. **Login to Render:**
   Go to [Render.com](https://render.com) and log in with your GitHub account.

3. **Deploy using Blueprint:**
   - On the dashboard, click the **"New +"** button.
   - Choose **"Blueprint"** from the drop-down list.
   - Connect your GitHub repository.
   - Render will automatically read the `render.yaml` file and show you that it is about to create two web services:
     1. `cyber-ids-backend`
     2. `cyber-ids-frontend`

4. **Apply and Wait:**
   - Click **Apply** or Save.
   - Render will now download your code, install the Python libraries for the backend, install the Node/NPM libraries for the frontend, and link them together perfectly.
   - Once the build says "Live" or "Deployed", click on the URL for `cyber-ids-frontend` to view your site!
