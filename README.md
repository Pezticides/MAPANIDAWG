**USTP Campus Navigator — Requirements and Installation Guide**
**MAPANIDAWG INSTRACKTIONS**

1. System Requirements

Before running the project, make sure you have the following installed:

Operating System: Windows, macOS, or Linux

Node.js: Compatible Node.js version for Expo SDK 57

npm: Installed automatically with Node.js

Git: Required to clone the repository

Visual Studio Code: Recommended for editing TypeScript and React Native files

Expo Go: Installed on an Android phone for testing

Internet connection: Required to download dependencies and load online map resources

Download the required software:

Node.js: https://nodejs.org/

Git: https://git-scm.com/downloads

Visual Studio Code: https://code.visualstudio.com/

Expo Go: https://expo.dev/go

2. Technologies and Dependencies

The project uses the following technologies:

React Native: Builds the mobile application interface.

Expo SDK 57: Provides the development environment and mobile app tools.

TypeScript: Used for typed source files such as .ts and .tsx.

Expo Router: Handles navigation between application screens.

React Native WebView: Displays the Leaflet map inside the mobile application.

Leaflet: Displays the interactive map, markers, and location information.

OpenStreetMap: Provides the online map tiles.

Expo Location: Provides device location functionality.

AsyncStorage: Stores saved campus locations locally.

Ionicons: Provides icons for the user interface.

Most JavaScript and TypeScript dependencies are installed automatically through npm install using the repository's package.json and package-lock.json.

3. Clone the GitHub Repository

Open PowerShell or the VS Code terminal and execute:

git clone YOUR_GITHUB_REPOSITORY_URL

Replace YOUR_GITHUB_REPOSITORY_URL with the actual repository URL.

Navigate into the downloaded project:

cd YOUR_REPOSITORY_FOLDER

If the actual application is inside a subfolder named mapa, enter it:

cd mapa

Make sure the current folder contains package.json before proceeding.

4. Install Project Dependencies

Execute the following command:

npm install

This installs the project's dependencies, including Expo, React Native, TypeScript, Expo Router, and other packages declared in package.json.

Important: Do not install TypeScript or every package individually if they are already declared in the project. The dependency installation should handle them automatically.

5. TypeScript Setup

The project uses TypeScript, so its source files may have .ts and .tsx extensions. TypeScript should already be included in the project's dependencies.

To check the TypeScript compiler, run:

npx tsc --version

To check the project's TypeScript files for type errors, run:

npx tsc --noEmit

The second command checks types without generating compiled JavaScript files. If errors appear, review them before assuming the project is ready to run.

6. Check Expo Configuration

To check whether the project configuration is valid, execute:

npx expo-doctor

This checks common project configuration and dependency issues. If it reports problems, review the messages before changing or upgrading package versions.

7. Run the Application

Start the Expo development server:

npx expo start --go --clear

Wait until the QR code appears in the terminal.

Open Expo Go on your Android phone and scan the QR code. Connect the phone and computer to the same Wi-Fi network if necessary.

If the normal connection does not work, stop the server using Ctrl + C and execute:

npx expo start --go --tunnel

Wait for Expo to reconnect, then scan the QR code again.

8. Run the Application Again Later

After completing the initial installation, navigate to the project folder and execute:

npx expo start --go

You generally do not need to run npm install again unless dependencies change or you clone a fresh copy of the repository.

9. Troubleshooting

Error: npm is not recognized

Install Node.js, reopen the terminal, and check:

node -v
npm -v

Error: package.json not found

Make sure you are inside the actual application folder.

Error: Unable to resolve module

Run:

npm install
npx expo start --go --clear

TypeScript errors

Run:

npx tsc --noEmit

Read the error messages and check the affected source files.

Map tiles or markers are not loading

Check your internet connection. The Leaflet map and OpenStreetMap tiles require online resources. Also verify the coordinates in data/campusLocations.ts.

Expo Go reports an incompatible project version

Check the Expo SDK version in package.json and use a compatible Expo Go version or an appropriate development build.

10. Important Notes

Keep package.json and package-lock.json in the GitHub repository.

Do not upload the node_modules folder; each developer can generate it by running npm install.

Do not randomly upgrade Expo or React Native packages because version mismatches can break the application.

Campus coordinates should be verified before publishing the application.

OpenStreetMap and Leaflet require internet access to load their online resources.

Quick setup commands:

git clone YOUR_GITHUB_REPOSITORY_URL
cd YOUR_REPOSITORY_FOLDER
npm install
npx expo-doctor
npx expo start --go --clear

If the app is nested inside another folder, navigate into the folder containing package.json before running the installation and startup commands.
