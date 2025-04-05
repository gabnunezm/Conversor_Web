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