document.addEventListener("DOMContentLoaded", () => {
  // Elementos DOM
  const themeToggle = document.getElementById("theme-toggle")
  const startRecordingBtn = document.getElementById("start-recording")
  const stopRecordingBtn = document.getElementById("stop-recording")
  const recordingStatus = document.getElementById("recording-status")
  const speechOutput = document.getElementById("speech-output")
  const copySpeechBtn = document.getElementById("copy-speech")
  const clearSpeechBtn = document.getElementById("clear-speech")
  const textInput = document.getElementById("text-input")
  const voiceSelect = document.getElementById("voice-select")
  const rateSlider = document.getElementById("rate-slider")
  const rateValue = document.getElementById("rate-value")
  const speakTextBtn = document.getElementById("speak-text")
  const stopSpeakingBtn = document.getElementById("stop-speaking")

  // Elementos para carga de archivos de audio
  const audioDropzone = document.getElementById("audio-dropzone")
  const audioFileInput = document.getElementById("audio-file-input")
  const audioFileInfo = document.getElementById("audio-file-info")
  const audioFileName = document.getElementById("audio-file-name")
  const audioPlayer = document.getElementById("audio-player")
  const transcribeAudioBtn = document.getElementById("transcribe-audio")

  // Inicializar tema
  if (
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  ) {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }

  // Cambiar tema de oscuro a claro
  themeToggle.addEventListener("click", () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    }
  })

  // Reconocimiento de voz
  let recognition = null
  let hasRecordedSomething = false

  if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    startRecordingBtn.addEventListener("click", () => {
      // Crear una nueva instancia cada vez que se inicia la grabación
      recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "es-ES" // Idioma predeterminado

      speechOutput.value = ""
      speechOutput.readOnly = true // Asegurar que sea de solo lectura durante la grabación
      recordingStatus.textContent = "Solicitando permisos..."

      recognition.onstart = () => {
        recordingStatus.textContent = "Escuchando... Habla ahora"
        startRecordingBtn.classList.add("hidden")
        stopRecordingBtn.classList.remove("hidden")
        stopRecordingBtn.classList.add("pulse")
        console.log("Reconocimiento iniciado correctamente")
      }

      recognition.onend = () => {
        recordingStatus.textContent = "Grabación detenida"
        startRecordingBtn.classList.remove("hidden")
        stopRecordingBtn.classList.add("hidden")
        stopRecordingBtn.classList.remove("pulse")
        console.log("Reconocimiento finalizado")

        // Hacer el área de texto editable solo si se ha grabado algo
        if (speechOutput.value.trim() !== "") {
          hasRecordedSomething = true
          speechOutput.readOnly = false
        }
      }

      recognition.onresult = (event) => {
        console.log("Resultado recibido", event)

        // Reiniciar el texto completamente en cada evento de resultado
        let finalText = ""
        let interimText = ""

        // Procesar todos los resultados desde el inicio
        for (let i = 0; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalText += transcript + " "
          } else {
            interimText += transcript
          }
        }

        // Actualizar el área de texto con el resultado final y el interino
        speechOutput.value = finalText + interimText
      }

      recognition.onerror = (event) => {
        console.error("Error de reconocimiento:", event.error)
        recordingStatus.textContent = "Error: " + event.error + ". Intenta de nuevo."
        startRecordingBtn.classList.remove("hidden")
        stopRecordingBtn.classList.add("hidden")
        stopRecordingBtn.classList.remove("pulse")

        // Mensajes de error
        if (event.error === "not-allowed") {
          recordingStatus.textContent =
            "Error: Permiso de micrófono denegado. Verifica la configuración de tu navegador."
        } else if (event.error === "no-speech") {
          recordingStatus.textContent = "No se detectó audio. Verifica que tu micrófono esté funcionando."
        }
      }

      try {
        recognition.start()
        console.log("Intentando iniciar reconocimiento")
      } catch (err) {
        console.error("Error al iniciar el reconocimiento:", err)
        recordingStatus.textContent = "Error al iniciar: " + err.message
      }
    })

    stopRecordingBtn.addEventListener("click", () => {
      if (recognition) {
        try {
          recognition.stop()
        } catch (err) {
          console.error("Error al detener el reconocimiento:", err)
        }
      }
    })
  } else {
    startRecordingBtn.disabled = true
    recordingStatus.textContent = "El reconocimiento de voz no está soportado en este navegador"
  }

  // Funcionalidad de carga de archivos de audio
  // Abrir el selector de archivos al hacer clic en la zona de drop
  audioDropzone.addEventListener("click", (e) => {
    // Evitar que el clic se propague si se hace clic en el botón de transcribir
    if (e.target === transcribeAudioBtn || transcribeAudioBtn.contains(e.target)) {
      e.stopPropagation()
      return
    }
    audioFileInput.click()
  })
  // Prevenir comportamiento por defecto de arrastrar y soltar
  ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    audioDropzone.addEventListener(eventName, preventDefaults, false)
  })

  function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
  }
  // Resaltar la zona de drop cuando se arrastra un archivo sobre ella
  ;["dragenter", "dragover"].forEach((eventName) => {
    audioDropzone.addEventListener(eventName, highlight, false)
  })
  ;["dragleave", "drop"].forEach((eventName) => {
    audioDropzone.addEventListener(eventName, unhighlight, false)
  })

  function highlight() {
    audioDropzone.classList.add("border-primary-500")
  }

  function unhighlight() {
    audioDropzone.classList.remove("border-primary-500")
  }

  // Manejar el archivo soltado
  audioDropzone.addEventListener("drop", handleDrop, false)

  function handleDrop(e) {
    const dt = e.dataTransfer
    const files = dt.files
    handleFiles(files)
  }

  // Manejar la selección de archivos desde el input
  audioFileInput.addEventListener("change", function () {
    handleFiles(this.files)
  })

  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0]
      // Verificar si es un archivo de audio soportado
      const validTypes = [
        "audio/mp3",
        "audio/wav",
        "audio/flac",
        "audio/m4a",
        "audio/aac",
        "audio/aiff",
        "audio/ogg",
        "audio/mpeg",
      ]

      // Obtener la extensión del archivo
      const fileExtension = file.name.split(".").pop().toLowerCase()
      const validExtensions = ["mp3", "wav", "flac", "m4a", "aac", "aiff", "ogg"]

      if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
        displayAudioFile(file)
      } else {
        alert("Por favor, selecciona un archivo de audio válido (MP3, WAV, FLAC, M4A, AAC, AIFF, OGG)")
      }
    }
  }

  function displayAudioFile(file) {
    // Mostrar información del archivo
    audioFileName.textContent = file.name
    audioFileInfo.classList.remove("hidden")

    // Crear URL para el archivo de audio
    const audioURL = URL.createObjectURL(file)
    audioPlayer.src = audioURL

    // Limpiar el input de archivo para permitir seleccionar el mismo archivo nuevamente
    audioFileInput.value = ""
  }

  // Función para subir el archivo a AssemblyAI
  async function uploadFileToAssemblyAI(file) {
    try {
      // Verificar que tenemos una API key
      if (!assemblyApiKey) {
        throw new Error("API Key no configurada. Por favor, ingresa tu API Key de AssemblyAI.")
      }

      // Primero, obtener una URL para subir el archivo
      const response = await fetch("https://api.assemblyai.com/v2/upload", {
        method: "POST",
        headers: {
          Authorization: assemblyApiKey,
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error(`Error al subir el archivo: ${response.status} ${response.statusText}`)
      }

      const uploadData = await response.json()
      return uploadData.upload_url
    } catch (error) {
      console.error("Error al subir el archivo:", error)
      throw error
    }
  }

  // Función para iniciar la transcripción
  async function startTranscription(audioUrl) {
    try {
      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          Authorization: assemblyApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_url: audioUrl,
          language_code: "es",
        }),
      })

      if (!response.ok) {
        throw new Error(`Error al iniciar la transcripción: ${response.status} ${response.statusText}`)
      }

      const transcriptionData = await response.json()
      return transcriptionData.id
    } catch (error) {
      console.error("Error al iniciar la transcripción:", error)
      throw error
    }
  }

  // Función para verificar el estado de la transcripción
  async function checkTranscriptionStatus(transcriptionId) {
    try {
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptionId}`, {
        method: "GET",
        headers: {
          Authorization: assemblyApiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al verificar el estado de la transcripción: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error al verificar el estado de la transcripción:", error)
      throw error
    }
  }

  // Función para esperar a que la transcripción esté completa
  async function waitForTranscriptionToComplete(transcriptionId, updateCallback) {
    try {
      let result
      let status = "processing"

      while (status === "processing" || status === "queued") {
        result = await checkTranscriptionStatus(transcriptionId)
        status = result.status

        if (status === "processing" || status === "queued") {
          if (updateCallback) {
            updateCallback(status, result.percent)
          }
          await new Promise((resolve) => setTimeout(resolve, 1000)) // Esperar 1 segundo antes de verificar de nuevo
        }
      }

      return result
    } catch (error) {
      console.error("Error al esperar la transcripción:", error)
      throw error
    }
  }

  // Transcribir el audio cargado con AssemblyAI
  transcribeAudioBtn.addEventListener("click", async (e) => {
    e.stopPropagation() // Evitar que el clic se propague al contenedor

    if (!audioPlayer.src) {
      alert("Por favor, carga un archivo de audio primero")
      return
    }

    // Verificar que tenemos una API key
    if (!assemblyApiKey || assemblyApiKey === "TU_API_KEY_AQUÍ") {
      alert("Por favor, configura tu API Key de AssemblyAI en el archivo script.js")
      return
    }

    try {
      // Cambiar el estado del botón
      const originalText = transcribeAudioBtn.textContent
      transcribeAudioBtn.textContent = "Procesando..."
      transcribeAudioBtn.disabled = true

      // Mostrar mensaje de procesamiento
      speechOutput.value = "Subiendo archivo de audio a AssemblyAI..."
      speechOutput.readOnly = true

      // Obtener el archivo de audio del reproductor
      const audioFile = await fetch(audioPlayer.src).then((r) => r.blob())

      // Subir el archivo a AssemblyAI
      const uploadUrl = await uploadFileToAssemblyAI(audioFile)

      // Iniciar la transcripción
      speechOutput.value = "Iniciando transcripción..."
      const transcriptionId = await startTranscription(uploadUrl)

      // Esperar a que la transcripción esté completa
      speechOutput.value = "Transcribiendo audio (0%)..."
      const result = await waitForTranscriptionToComplete(transcriptionId, (status, percent) => {
        speechOutput.value = `Transcribiendo audio (${percent}%)...`
      })

      // Verificar el resultado
      if (result.status === "completed") {
        // Mostrar la transcripción
        speechOutput.value = result.text

        // Hacer el área de texto editable
        if (speechOutput.value.trim() !== "") {
          hasRecordedSomething = true
          speechOutput.readOnly = false
        }
      } else if (result.status === "error") {
        speechOutput.value = `Error en la transcripción: ${result.error}`
      } else {
        speechOutput.value = `Estado de transcripción inesperado: ${result.status}`
      }

      // Restaurar el estado del botón
      transcribeAudioBtn.textContent = originalText
      transcribeAudioBtn.disabled = false
    } catch (error) {
      console.error("Error en el proceso de transcripción:", error)
      speechOutput.value = `Error: ${error.message}`
      transcribeAudioBtn.textContent = "Transcribir"
      transcribeAudioBtn.disabled = false
    }
  })

  // Evitar que el clic en el botón de transcribir abra el selector de archivos
  transcribeAudioBtn.addEventListener("click", (e) => {
    e.stopPropagation()
  })

  // Copiar texto reconocido
  copySpeechBtn.addEventListener("click", () => {
    if (speechOutput.value) {
      navigator.clipboard
        .writeText(speechOutput.value)
        .then(() => {
          const originalText = copySpeechBtn.textContent
          copySpeechBtn.textContent = "Copiado!"
          setTimeout(() => {
            copySpeechBtn.textContent = originalText
          }, 2000)
        })
        .catch((err) => {
          console.error("Error al copiar texto: ", err)
        })
    }
  })

  // Limpiar texto reconocido
  clearSpeechBtn.addEventListener("click", () => {
    speechOutput.value = ""
    // Si se limpia el texto, volver a hacer el área de solo lectura
    hasRecordedSomething = false
    speechOutput.readOnly = true
  })

  // Síntesis de voz
  const synth = window.speechSynthesis
  let voices = []

  function populateVoiceList() {
    voices = synth.getVoices()
    voiceSelect.innerHTML = ""

    voices.forEach((voice, i) => {
      const option = document.createElement("option")
      option.textContent = `${voice.name} (${voice.lang})`
      option.setAttribute("data-lang", voice.lang)
      option.setAttribute("data-name", voice.name)
      option.value = i
      voiceSelect.appendChild(option)
    })

    // Seleccionar voz en español si está disponible
    const spanishVoice = voices.findIndex((voice) => voice.lang.includes("es"))
    if (spanishVoice !== -1) {
      voiceSelect.value = spanishVoice
    }
  }

  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = populateVoiceList
  }

  // Inicializar voces
  setTimeout(populateVoiceList, 100)

  // Actualizar valor de velocidad
  rateSlider.addEventListener("input", () => {
    rateValue.textContent = rateSlider.value
  })

  // Reproducir texto
  speakTextBtn.addEventListener("click", () => {
    if (synth.speaking) {
      synth.cancel()
    }

    const text = textInput.value
    if (text) {
      const utterance = new SpeechSynthesisUtterance(text)

      if (voiceSelect.value) {
        utterance.voice = voices[voiceSelect.value]
      }

      utterance.rate = Number.parseFloat(rateSlider.value)

      utterance.onstart = () => {
        speakTextBtn.disabled = true
      }

      utterance.onend = () => {
        speakTextBtn.disabled = false
      }

      utterance.onerror = () => {
        speakTextBtn.disabled = false
      }

      synth.speak(utterance)
    }
  })

  // Detener reproducción
  stopSpeakingBtn.addEventListener("click", () => {
    if (synth.speaking) {
      synth.cancel()
      speakTextBtn.disabled = false
    }
  })
})