# Wheel of Names

This is a fun JavaScript project that creates an interactive "Wheel of Names". You can input any names, spin the wheel, and select a random winner. For added amusement, there's a rigged feature that allows you to predetermine the winner secretly.

Try it out here: [Wheel of Names](https://wheelofnamesv2.netlify.app/)

## Features

- **Add Names:** Enter names separated by commas to populate the wheel.
- **Interactive Wheel:** The wheel visually spins and selects a random winner.
- **Rigged Winner (Just for Fun):** Secretly set a winner before spinning the wheel.

## Run Locally

This project includes a small production server for hosting platforms such as Railway.

```bash
npm start
```

Open `http://localhost:3000` in a browser. The server uses Railway's `PORT` environment variable automatically when deployed.

## Deploy to Railway

1. Push this project to a GitHub repository.
2. In Railway, create a new project and choose **Deploy from GitHub repo**.
3. Select the repository. Railway will detect `package.json` and run `npm start`.
4. Open the generated Railway domain when deployment finishes.

No environment variables are required.

## How to Use

### Basic Usage

1. **Enter Names:**
   - Type the names into the textarea provided, separated by commas (e.g., `Alice, Bob, Charlie, Dana`).

2. **Update Wheel:**
   - Click the **"Update Wheel"** button to generate the wheel with your entered names.

3. **Spin the Wheel:**
   - Click the **"Spin the Wheel"** button to spin and randomly select a winner.

### Rigging the Winner (Optional and Just for Fun)

1. **Prepare to Rig:**
   - Click anywhere outside the input fields to ensure they are not focused.

2. **Activate Rigging Mode:**
   - Press the **spacebar** to start rigging mode. You'll receive a prompt to enter the rigged winner's name.

3. **Enter the Winner's Name:**
   - Type the exact name of the person you want to rig as the winner.

4. **Confirm Rigged Winner:**
   - Press the **spacebar** again to confirm your selection.

5. **Spin the Wheel:**
   - Click the **"Spin the Wheel"** button. The wheel will spin and land on your rigged winner.

*Note: The rigged winner feature is intended for entertainment purposes. Use it responsibly!*

## GitHub Repository

You can find the source code on GitHub: [Wheel of Names Repository](https://github.com/makinhs/wheel-of-names)

## Disclaimer

This project was created for fun and educational purposes. It includes a rigged feature as a JavaScript example. Use it at your own risk.

## License

This project is open-source and free to use. Feel free to modify and distribute it as you like.

---

Enjoy spinning the wheel!
