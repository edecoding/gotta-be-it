// wheel.js

var canvas = document.getElementById('wheelCanvas');
var ctx = canvas.getContext('2d');
var names = [];
var startAngle = 0;
var arc = 0;
var spinTimeout = null;
var spinTime = 0;
var spinTimeTotal = 0;
var totalRotation = 0;
var initialStartAngle = 0;
var isRigging = false;
var riggedWinner = '';
var riggedInput = '';
var currentWinner = '';
var confettiFrame = null;
var results = [];
var autoRemoveTimer = null;
var audioContext = null;
var spinAudioTimer = null;

// Hidden pity-system state. It is deliberately kept out of the UI.
var consecutiveNaturalLWins = 0;
var pityWUsed = false;
var pityWPending = false;

var settings = {
  displayDuplicates: true,
  spinSlowly: false,
  showTitle: true,
  spinTime: 5,
  launchConfetti: true,
  displayPopup: true,
  displayRemoveButton: true,
  autoRemoveWinner: false,
  pointerChangesColor: true,
  pageGradient: true,
  wheelShadow: true,
  duringSound: 'tick',
  duringVolume: 50,
  afterSound: 'applause',
  afterVolume: 50,
  removeSound: false
};

loadSettings();

document.getElementById('spinBtn').addEventListener('click', spin);
canvas.addEventListener('click', function() {
  if (!document.getElementById('spinBtn').disabled) spin();
});
document.getElementById('shuffleBtn').addEventListener('click', function() {
  names.sort(function() { return Math.random() - 0.5; });
  document.getElementById('namesInput').value = names.join('\n');
  updateWheel();
});
document.getElementById('sortBtn').addEventListener('click', function() {
  names.sort(function(first, second) { return first.localeCompare(second); });
  document.getElementById('namesInput').value = names.join('\n');
  updateWheel();
});
document.getElementById('namesInput').addEventListener('input', updateWheel);
document.getElementById('closeWinnerBtn').addEventListener('click', closeWinnerDialog);
document.getElementById('removeWinnerBtn').addEventListener('click', removeWinner);
document.getElementById('winnerOverlay').addEventListener('click', closeWinnerDialog);
document.addEventListener('click', function() {
  if (document.getElementById('winnerOverlay').classList.contains('visible')) closeWinnerDialog();
});
document.getElementById('entriesTab').addEventListener('click', function() { switchPanel('entries'); });
document.getElementById('resultsTab').addEventListener('click', function() { switchPanel('results'); });
document.getElementById('resultsSortBtn').addEventListener('click', function() {
  results.sort(function(first, second) { return first.localeCompare(second); });
  saveResults();
  renderResults();
});
document.getElementById('clearResultsBtn').addEventListener('click', function() {
  results = [];
  saveResults();
  renderResults();
});
document.getElementById('exportResultsBtn').addEventListener('click', exportResults);
document.getElementById('customizeBtn').addEventListener('click', openCustomize);
document.getElementById('cancelCustomize').addEventListener('click', closeCustomize);
document.getElementById('saveCustomize').addEventListener('click', saveCustomize);
document.querySelectorAll('[data-customize-tab]').forEach(function(tab) {
  tab.addEventListener('click', function() {
    var tabName = tab.getAttribute('data-customize-tab');
    document.querySelectorAll('[data-customize-tab]').forEach(function(item) { item.classList.toggle('active', item === tab); });
    document.querySelectorAll('[data-customize-page]').forEach(function(page) { page.classList.toggle('active', page.getAttribute('data-customize-page') === tabName); });
  });
});

document.addEventListener('keydown', function(event) {
  if (document.activeElement.tagName.toLowerCase() === 'textarea' || document.activeElement.tagName.toLowerCase() === 'input') return;

  // Keyboard shortcuts: R selects L and T selects W, but only when that
  // exact choice is present in the wheel. The spin starts immediately.
  if (!isRigging && (event.key.toLowerCase() === 'r' || event.key.toLowerCase() === 't')) {
    var shortcutChoice = event.key.toLowerCase() === 'r' ? 'l' : 'w';
    var shortcutWinner = names.find(function(name) {
      return name.toLowerCase() === shortcutChoice;
    });
    if (shortcutWinner !== undefined && !document.getElementById('spinBtn').disabled) {
      event.preventDefault();
      riggedWinner = shortcutWinner;
      spin();
    }
    return;
  }

  if (event.code === 'Space') {
    event.preventDefault();
    if (!isRigging) {
      isRigging = true;
      riggedInput = '';
      console.log('Enter the rigged winner\'s name and press space to confirm.');
    } else {
      isRigging = false;
      riggedWinner = riggedInput.trim();
      console.log(riggedWinner !== '' ? 'Rigged winner set to: ' + riggedWinner : 'Rigged winner cleared.');
    }
  } else if (isRigging) {
    riggedInput += event.key;
  }
});

function setCanvasSize() {
  var containerWidth = canvas.parentElement.clientWidth;
  var containerHeight = window.innerHeight;
  var size = Math.min(containerWidth * 0.9, containerHeight * 0.5);
  canvas.width = size;
  canvas.height = size;
}

function updateWheel() {
  var input = document.getElementById('namesInput').value;
  names = input.split(/[\n,]/).map(function(name) { return name.trim(); }).filter(function(name) { return name !== ''; });
  if (!settings.displayDuplicates) names = names.filter(function(name, index) { return names.indexOf(name) === index; });
  startAngle = 0;
  setCanvasSize();
  drawWheel();
  updateEntryCount();
  localStorage.setItem('wheelNames', JSON.stringify(names));
}

function updateEntryCount() {
  var value = document.getElementById('namesInput').value;
  var count = value.split(/[\n,]/).filter(function(name) { return name.trim() !== ''; }).length;
  document.getElementById('entryCount').textContent = count;
}

function loadSettings() {
  var storedSettings = localStorage.getItem('wheelSettings');
  if (storedSettings) settings = Object.assign(settings, JSON.parse(storedSettings));
}

function openCustomize() {
  document.getElementById('displayDuplicates').checked = settings.displayDuplicates;
  document.getElementById('spinSlowly').checked = settings.spinSlowly;
  document.getElementById('showTitle').checked = settings.showTitle;
  document.getElementById('spinTime').value = settings.spinTime;
  document.getElementById('launchConfetti').checked = settings.launchConfetti;
  document.getElementById('displayPopup').checked = settings.displayPopup;
  document.getElementById('displayRemoveButton').checked = settings.displayRemoveButton;
  document.getElementById('autoRemoveWinner').checked = settings.autoRemoveWinner;
  document.getElementById('pointerChangesColor').checked = settings.pointerChangesColor;
  document.getElementById('pageGradient').checked = settings.pageGradient;
  document.getElementById('wheelShadow').checked = settings.wheelShadow;
  document.getElementById('duringSound').value = settings.duringSound;
  document.getElementById('duringVolume').value = settings.duringVolume;
  document.getElementById('afterSound').value = settings.afterSound;
  document.getElementById('afterVolume').value = settings.afterVolume;
  document.getElementById('removeSound').checked = settings.removeSound;
  document.getElementById('popupMessage').value = settings.popupMessage || 'We have a winner!';
  document.getElementById('customizeOverlay').classList.add('visible');
  document.getElementById('customizeOverlay').setAttribute('aria-hidden', 'false');
}
function closeCustomize() {
  document.getElementById('customizeOverlay').classList.remove('visible');
  document.getElementById('customizeOverlay').setAttribute('aria-hidden', 'true');
}
function saveCustomize() {
  settings.displayDuplicates = document.getElementById('displayDuplicates').checked;
  settings.spinSlowly = document.getElementById('spinSlowly').checked;
  settings.showTitle = document.getElementById('showTitle').checked;
  settings.spinTime = Number(document.getElementById('spinTime').value);
  settings.launchConfetti = document.getElementById('launchConfetti').checked;
  settings.displayPopup = document.getElementById('displayPopup').checked;
  settings.displayRemoveButton = document.getElementById('displayRemoveButton').checked;
  settings.autoRemoveWinner = document.getElementById('autoRemoveWinner').checked;
  settings.pointerChangesColor = document.getElementById('pointerChangesColor').checked;
  settings.pageGradient = document.getElementById('pageGradient').checked;
  settings.wheelShadow = document.getElementById('wheelShadow').checked;
  settings.duringSound = document.getElementById('duringSound').value;
  settings.duringVolume = Number(document.getElementById('duringVolume').value);
  settings.afterSound = document.getElementById('afterSound').value;
  settings.afterVolume = Number(document.getElementById('afterVolume').value);
  settings.removeSound = document.getElementById('removeSound').checked;
  settings.popupMessage = document.getElementById('popupMessage').value || 'We have a winner!';
  localStorage.setItem('wheelSettings', JSON.stringify(settings));
  applySettings();
  closeCustomize();
}
function applySettings() {
  document.body.classList.toggle('no-page-gradient', !settings.pageGradient);
  document.body.classList.toggle('no-wheel-shadow', !settings.wheelShadow);
  updatePointerColor();
}
function switchPanel(panelName) {
  var showingResults = panelName === 'results';
  document.getElementById('entriesTab').classList.toggle('active', !showingResults);
  document.getElementById('resultsTab').classList.toggle('active', showingResults);
  document.getElementById('entriesView').hidden = showingResults;
  document.getElementById('resultsView').hidden = !showingResults;
}
function saveResults() { localStorage.setItem('wheelResults', JSON.stringify(results)); }
function renderResults() {
  document.getElementById('resultCount').textContent = results.length;
  document.getElementById('resultsInput').value = results.join('\n');
}
function recordResult(winner) { results.push(winner); saveResults(); renderResults(); }
function exportResults() {
  if (results.length === 0) return;
  var blob = new Blob([results.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'wheel-results.txt';
  link.click();
  URL.revokeObjectURL(link.href);
}

function drawWheel() {
  var outsideRadius = canvas.width / 2 - 20;
  var textRadius = outsideRadius * 0.70;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (names.length === 0) {
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('No names available!', canvas.width / 2 - ctx.measureText('No names available!').width / 2, canvas.height / 2);
    return;
  }
  var numSegments = names.length;
  arc = 2 * Math.PI / numSegments;
  updatePointerColor();
  for (var i = 0; i < numSegments; i++) {
    var angle = startAngle + i * arc;
    var color = getColor(i, numSegments);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height / 2);
    ctx.arc(canvas.width / 2, canvas.height / 2, outsideRadius, angle, angle + arc, false);
    ctx.lineTo(canvas.width / 2, canvas.height / 2);
    ctx.fill();
    ctx.save();
    ctx.fillStyle = getContrastingTextColor(color);
    ctx.translate(canvas.width / 2 + Math.cos(angle + arc / 2) * textRadius, canvas.height / 2 + Math.sin(angle + arc / 2) * textRadius);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    var text = names[i];
    ctx.font = Math.max(24, outsideRadius / 4.5) + 'px Roboto, Arial, sans-serif';
    ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
    ctx.restore();
  }
}
function updatePointerColor() {
  if (names.length === 0 || !arc) return;
  if (!settings.pointerChangesColor) {
    document.querySelector('.pointer').style.setProperty('--pointer-color', '#2864dc');
    return;
  }
  var pointerAngle = ((-startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  var pointerIndex = Math.floor(pointerAngle / arc) % names.length;
  document.querySelector('.pointer').style.setProperty('--pointer-color', getColor(pointerIndex, names.length));
}
function getColor(item, maxitem) {
  if (maxitem === 2) return item === 0 ? '#ed1b2f' : '#2864dc';
  return 'hsl(' + item * (360 / maxitem) + ', 100%, 50%)';
}
function getContrastingTextColor(backgroundColor) {
  if (backgroundColor.charAt(0) === '#') return 'white';
  var result = /hsl\((\d+),\s*(\d+)%\,\s*(\d+)%\)/.exec(backgroundColor);
  var rgb = hslToRgb(parseInt(result[1]) / 360, parseInt(result[2]) / 100, parseInt(result[3]) / 100);
  var luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  return luminance > 0.6 ? 'black' : 'white';
}
function hslToRgb(h, s, l) {
  var r, g, b;
  if (s === 0) r = g = b = l;
  else {
    var hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: r, g: g, b: b };
}

function spin() {
  if (names.length === 0) { alert('No names available to spin!'); return; }
  spinTime = 0;
  spinTimeTotal = settings.spinTime * 1000 * (settings.spinSlowly ? 2 : 1);
  initialStartAngle = startAngle;
  var rotations = Math.floor(Math.random() * 3) + 3;
  pityWPending = false;

  // After three consecutive L results, force W exactly once when W is present.
  var wIndex = names.findIndex(function(name) { return name.toLowerCase() === 'w'; });
  if (!pityWUsed && consecutiveNaturalLWins >= 3 && wIndex !== -1) {
    var pityTargetAngle = -((wIndex + 0.5) * arc);
    var pityAngleDifference = (pityTargetAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);
    totalRotation = rotations * 2 * Math.PI + pityAngleDifference;
    pityWPending = true;
  } else if (riggedWinner) {
    var winnerIndex = names.indexOf(riggedWinner);
    if (winnerIndex === -1) {
      alert('Rigged winner "' + riggedWinner + '" not found in the names list.');
      riggedWinner = '';
    } else {
      var desiredAngle = -((winnerIndex + 0.5) * arc);
      var angleDifference = (desiredAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);
      totalRotation = rotations * 2 * Math.PI + angleDifference;
    }
  } else if (names.length === 2 && names.some(function(name) { return name.toLowerCase() === 'l'; })) {
    var lIndex = names.findIndex(function(name) { return name.toLowerCase() === 'l'; });
    var targetIndex = Math.random() < 0.68 ? lIndex : (lIndex === 0 ? 1 : 0);
    var randomSegmentPosition = 0.15 + Math.random() * 0.7;
    var targetAngle = -((targetIndex + randomSegmentPosition) * arc);
    var targetDifference = (targetAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);
    totalRotation = rotations * 2 * Math.PI + targetDifference;
  } else {
    totalRotation = rotations * 2 * Math.PI + Math.random() * 2 * Math.PI;
  }
  document.getElementById('spinBtn').disabled = true;
  document.getElementById('result').classList.remove('show');
  startSpinSound();
  rotateWheel();
}
function rotateWheel() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    startAngle = (initialStartAngle + totalRotation) % (2 * Math.PI);
    stopRotateWheel();
    return;
  }
  startAngle = initialStartAngle + easeOut(spinTime / spinTimeTotal) * totalRotation;
  drawWheel();
  spinTimeout = setTimeout(rotateWheel, 30);
}
function stopRotateWheel() {
  clearTimeout(spinTimeout);
  stopSpinSound();
  var pointerAngle = ((-startAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  var index = Math.floor(pointerAngle / arc) % names.length;
  var text = names[index];

  // Count consecutive L outcomes and consume the one-time pity result.
  if (text.toLowerCase() === 'l' && !pityWPending) {
    consecutiveNaturalLWins++;
  } else if (text.toLowerCase() === 'w') {
    if (pityWPending) pityWUsed = true;
    consecutiveNaturalLWins = 0;
  } else {
    consecutiveNaturalLWins = 0;
  }
  pityWPending = false;

  recordResult(text);
  document.getElementById('result').innerText = 'Congratulations! The winner is ' + text + '!';
  document.getElementById('result').classList.add('show');
  showWinnerDialog(text);
  playAfterSound();
  riggedWinner = '';
  document.getElementById('spinBtn').disabled = false;
}
function showWinnerDialog(winner) {
  currentWinner = winner;
  if (!settings.displayPopup) {
    if (settings.autoRemoveWinner) autoRemoveTimer = setTimeout(removeWinner, 5000);
    return;
  }
  document.getElementById('winnerName').textContent = winner;
  document.getElementById('winnerTitle').textContent = settings.popupMessage || 'We have a winner!';
  document.getElementById('removeWinnerBtn').hidden = !settings.displayRemoveButton;
  document.getElementById('winnerOverlay').classList.add('visible');
  document.getElementById('winnerOverlay').setAttribute('aria-hidden', 'false');
  if (settings.launchConfetti) startConfetti();
  if (settings.autoRemoveWinner) autoRemoveTimer = setTimeout(removeWinner, 5000);
}
function closeWinnerDialog() {
  clearTimeout(autoRemoveTimer);
  document.getElementById('winnerOverlay').classList.remove('visible');
  document.getElementById('winnerOverlay').setAttribute('aria-hidden', 'true');
  stopConfetti();
}
function removeWinner() {
  clearTimeout(autoRemoveTimer);
  if (settings.removeSound) playTone(180, 0.08, settings.afterVolume / 100);
  names = names.filter(function(name) { return name !== currentWinner; });
  document.getElementById('namesInput').value = names.join('\n');
  localStorage.setItem('wheelNames', JSON.stringify(names));
  startAngle = 0;
  setCanvasSize();
  drawWheel();
  updateEntryCount();
  closeWinnerDialog();
  document.getElementById('result').textContent = '';
}
function playTone(frequency, duration, volume) {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  var oscillator = audioContext.createOscillator();
  var gain = audioContext.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(Math.max(0.001, volume * 0.08), audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  oscillator.connect(gain); gain.connect(audioContext.destination);
  oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
}
function startSpinSound() {
  if (settings.duringSound === 'none') return;
  stopSpinSound();
  var tick = function() { playTone(420, 0.045, settings.duringVolume / 100); };
  tick();
  spinAudioTimer = setInterval(tick, settings.spinSlowly ? 180 : 120);
}
function stopSpinSound() { if (spinAudioTimer) clearInterval(spinAudioTimer); spinAudioTimer = null; }
function playAfterSound() {
  if (settings.afterSound === 'none') return;
  playTone(523, 0.12, settings.afterVolume / 100);
  setTimeout(function() { playTone(659, 0.16, settings.afterVolume / 100); }, 130);
}
function startConfetti() {
  var confettiCanvas = document.getElementById('confettiCanvas');
  var confettiContext = confettiCanvas.getContext('2d');
  var pieces = [];
  var colors = ['#ed1b2f', '#2864dc', '#f4c21d', '#0aa95c'];
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  for (var i = 0; i < 150; i++) pieces.push({
    x: Math.random() * confettiCanvas.width, y: -Math.random() * confettiCanvas.height * 0.4,
    width: 4 + Math.random() * 5, height: 8 + Math.random() * 8,
    speed: 2 + Math.random() * 4, drift: (Math.random() - 0.5) * 2,
    angle: Math.random() * Math.PI, spin: (Math.random() - 0.5) * 0.18, color: colors[i % colors.length]
  });
  function renderConfetti() {
    confettiContext.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    pieces.forEach(function(piece) {
      piece.y += piece.speed; piece.x += piece.drift; piece.angle += piece.spin;
      if (piece.y > confettiCanvas.height + 20) piece.y = -20;
      confettiContext.save(); confettiContext.translate(piece.x, piece.y); confettiContext.rotate(piece.angle);
      confettiContext.fillStyle = piece.color;
      confettiContext.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
      confettiContext.restore();
    });
    confettiFrame = requestAnimationFrame(renderConfetti);
  }
  stopConfetti();
  renderConfetti();
}
function stopConfetti() {
  if (confettiFrame) cancelAnimationFrame(confettiFrame);
  confettiFrame = null;
  var confettiCanvas = document.getElementById('confettiCanvas');
  if (confettiCanvas) confettiCanvas.getContext('2d').clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

window.addEventListener('load', function() {
  applySettings();
  setCanvasSize();
  var storedResults = localStorage.getItem('wheelResults');
  if (storedResults) results = JSON.parse(storedResults);
  renderResults();
  var storedNames = localStorage.getItem('wheelNames');
  if (storedNames) {
    names = JSON.parse(storedNames);
    document.getElementById('namesInput').value = names.join('\n');
    updateEntryCount();
    startAngle = 0;
    drawWheel();
  } else drawWheel();
});
window.addEventListener('resize', function() { setCanvasSize(); drawWheel(); });
