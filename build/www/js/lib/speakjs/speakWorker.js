importScripts('speakGenerator.js');

onmessage = function(event) {
  var wav = generateSpeech(event.data.text, event.data.args);
  postMessage({ id: event.data.id, wav: wav });
};
