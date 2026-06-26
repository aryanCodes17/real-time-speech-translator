# 🎙️ Real-Time Speech Translator

A real-time multilingual speech translation web application that captures live speech, transcribes it using **Groq Whisper**, and translates it into multiple languages using **Google Gemini** with low-latency streaming.

---

## Features

* 🎤 Real-time speech-to-text transcription
* 🌍 Multilingual text translation
* ⚡ Low-latency streaming translation
* 📝 Live transcript and translated text panels
* 🎛️ Adjustable translation settings
* 📊 Latency monitoring
* 🔄 Continuous speech recognition
* 💾 Persistent application settings

---

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### AI & APIs

* Google Gemini API
* Groq API (Whisper)

### State Management

* React Context API
* Custom React Hooks

---

## Project Structure

```text
app/
components/
context/
hooks/
lib/
types/
```

---

## Installation

### Clone the repository

```bash
git clone https://github.com/aryanCodes17/real-time-speech-translator.git
cd real-time-speech-translator
```

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a `.env.local` file in the project root and add your API keys:

```env
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

### Run the development server

```bash
npm run dev
```

Open your browser and visit:

```text
http://localhost:3000
```

---

## License

This project is licensed under the MIT License.
