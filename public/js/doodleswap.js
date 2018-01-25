(function(window, document, undefined) {
  'use strict';

  firebase.initializeApp({
    apiKey:            "AIzaSyAFT7FvEgI5JT5XcWeEWn4syRkn67uEaRQ",
    authDomain:        "doodleswap-demo.firebaseapp.com",
    databaseURL:       "https://doodleswap-demo.firebaseio.com",
    projectId:         "doodleswap-demo",
    storageBucket:     "",
    messagingSenderId: "751567445657"
  });
  var db = firebase.database();

  function write(img) {
    var key = db.ref().child('images').push().key;
    var data = {};
    data['/images/' + key] = img;
    return db.ref().update(data);
  };

  function read() {
    return new Promise(function(resolve, reject) {
      db.ref('/images').orderByKey().limitToLast(2).once('value', function(snapshot) {
        var data = snapshot.val();
        for (var key of Object.keys(data)) {
          if (data[key].lastIndexOf('data:image/png;base64', 0) === 0) {
            resolve(data[key]);
          }
        }
        resolve(null);
      });
    });
  };

  const WIDTH  = 360,
        HEIGHT = 560;

  const COLORS = {
    'RED': '#f44336',
    'PINK': '#e91e63',
    'PURPLE': '#9c27b0',
    'DEEP_PURPLE': '#673ab7',
    'INDIGO': '#3f51b5',

    'BLUE': '#2196f3',
    'LIGHT_BLUE': '#03a9f4',
    'CYAN': '#00bcd4',
    'TEAL': '#009688',
    'GREEN': '#4caf50',

    'LIGHT_GREEN': '#8bc34a',
    'LIME': '#cddc39',
    'YELLOW': '#ffeb3b',
    'AMBER': '#ffc107',
    'ORANGE': '#ff9800',

    'DEEP_ORANGE': '#ff5722',
    'BROWN': '#795548',
    'GRAY': '#9e9e9e',
    'WHITE': '#ffffff',
    'BLACK': '#000000'
  };

  var strokeColor = COLORS[localStorage.getItem('strokeColor') || 'BLACK'],
      strokeWidth = localStorage.getItem('strokeWidth') || 10;

  function createMenu() {
    var menuContainer = document.createElement('div');
    menuContainer.setAttribute('id', 'menu-container');

    var palette = document.createElement('div');
    palette.setAttribute('id', 'palette');

    function clickColorEvent(e) {
      localStorage.setItem('strokeColor', this.dataset.color);
      strokeColor = COLORS[this.dataset.color];
    };

    for (var color of Object.keys(COLORS)) {
      if (COLORS.hasOwnProperty(color)) {
        var div = document.createElement('div');
        div.classList.add('palette-option');
        if (color === 'WHITE') {
          div.classList.add('palette-outline');
        }
        div.style.backgroundColor = COLORS[color];
        div.dataset.color = color;

        div.addEventListener('click', clickColorEvent, false);
        div.addEventListener('touchstart', clickColorEvent, false);
        palette.appendChild(div);
      }
    }
    menuContainer.appendChild(palette);

    var bottomRow = document.createElement('div');
    bottomRow.classList.add('menu-bottom-row');
    menuContainer.appendChild(bottomRow);

    var range = document.createElement('input');
    range.setAttribute('type', 'range');
    range.setAttribute('min', '0');
    range.setAttribute('max', '50');
    range.setAttribute('value', strokeWidth);
    range.addEventListener('change', function(e) {
      strokeWidth = this.value;
      localStorage.setItem('strokeWidth', this.value);
    }, false);
    bottomRow.appendChild(range);

    var toolButtons = document.createElement('div'),
        pencilButton = document.createElement('button'),
        eraserButton = document.createElement('button');

    toolButtons.setAttribute('id', 'tool-buttons');
    pencilButton.classList.add('tool-button', 'icon-pencil');
    eraserButton.classList.add('tool-button', 'icon-eraser');
    toolButtons.appendChild(pencilButton);
    toolButtons.appendChild(eraserButton);
    bottomRow.appendChild(toolButtons);

    function swapButtons(e) {
      if (toolButtons.firstElementChild === pencilButton) {
        while (toolButtons.hasChildNodes()) {
          toolButtons.removeChild(toolButtons.lastChild);
        }
        currentPenTool = 'ERASER';
        toolButtons.appendChild(eraserButton);
        toolButtons.appendChild(pencilButton);
      } else {
        while (toolButtons.hasChildNodes()) {
          toolButtons.removeChild(toolButtons.lastChild);
        }
        currentPenTool = 'PENCIL';
        toolButtons.appendChild(pencilButton);
        toolButtons.appendChild(eraserButton);
      }
    };
    pencilButton.addEventListener('click', swapButtons, false);
    eraserButton.addEventListener('click', swapButtons, false);

    var swapButton = document.createElement('button');
    swapButton.setAttribute('id', 'swap');
    swapButton.classList.add('icon-exchange');
    swapButton.addEventListener('click', function(e) {
      write(canvas.toDataURL()).then(read).then(function(newImage) {
        var tempIMG = new Image;
        tempIMG.addEventListener('load', function() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(tempIMG, 0, 0);
        });
        tempIMG.src = newImage;
      });
    }, false);
    bottomRow.appendChild(swapButton);

    return menuContainer;
  };

  var isDrawing = false,
      currentPosition, lastPosition;

  function getPosition(e) {
    if (e.touches && e.touches.length) {
      return getTouchPosition(e);
    }
    var rect = document.getElementById('wrapper').getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  function getTouchPosition(e) {
    var rect = document.getElementById('wrapper').getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  var canvas = document.createElement('canvas'),
      ctx = canvas.getContext('2d');
  canvas.setAttribute('width', WIDTH);
  canvas.setAttribute('height', HEIGHT);

  function downEvent(e) {
    isDrawing = true;
    currentPosition = lastPosition = getPosition(e);
  };

  function moveEvent(e) {
    currentPosition = getPosition(e);
  };

  function upEvent(e) {
    isDrawing = false;
    localStorage.setItem('canvas', canvas.toDataURL('image/png'));
  };

  canvas.addEventListener('mousedown', downEvent, false);
  document.addEventListener('mouseup', upEvent, false);
  document.addEventListener('mousemove', moveEvent, false);
  canvas.addEventListener('touchstart', function(e) {
     e.preventDefault();
     return downEvent(e);
  }, false);
  canvas.addEventListener('touchmove', moveEvent, false);
  for (var ev of ['touchend', 'touchcancel']) {
    document.addEventListener(ev, upEvent, false);
  }
  for (var ev of ['touchstart', 'touchend', 'touchmove']) {
    document.addEventListener(ev, function(e) {
      if (e.target === canvas) {
        e.preventDefault();
      }
    }, false);
  }

  const PEN_TOOLS = {
    'PENCIL': {
      draw: function() {
        ctx.lineJoin = ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(currentPosition.x, currentPosition.y);
        ctx.stroke();
        lastPosition = currentPosition;
      }
    },
    'ERASER': {
      draw: function() {
        ctx.lineJoin = ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = strokeWidth;
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(currentPosition.x, currentPosition.y);
        ctx.stroke();
        lastPosition = currentPosition;
      }
    }
  };

  var currentPenTool = 'PENCIL';

  document.addEventListener('DOMContentLoaded', function(e) {
    var wrapper = document.getElementById('wrapper');
    Promise.resolve(localStorage.getItem('canvas')).then(function(contents) {
      return new Promise(function(resolve, reject) {
        if (contents) {
          var tempIMG = new Image;
          tempIMG.addEventListener('load', function() {
            ctx.drawImage(tempIMG, 0, 0);
            resolve();
          });
          tempIMG.src = contents;
        }
        resolve();
      });
    }).then(function() {
      wrapper.appendChild(canvas);
      wrapper.appendChild(createMenu());

      (function render() {
        window.requestAnimationFrame(render);

        if (isDrawing) {
          PEN_TOOLS[currentPenTool].draw();
        }
      })();
    }).catch(function(e) {
      console.log(e);
    });

  }, false);
})(window, window.document);
