/**
 * This script provides various functionalities for a web page, including:
 * 
 * 1. **Cookie Management**:
 *    - `createCookie(name, value, days)`: Creates a cookie with a specified name, value, and expiration in days.
 *    - `readCookie(name)`: Reads the value of a cookie by its name.
 *    - `eraseCookie(name)`: Deletes a cookie by setting its expiration to a past date.
 *    - `coopcookie()`: Creates a cookie named "coop" with the value "hidden".
 * 
 * 2. **Sidebar and Navbar Functionality**:
 *    - Expands a relative sidebar dropdown on page load if a specific cookie is present.
 *    - Highlights the current page in the navbar and sidebar based on the URL.
 *    - Automatically expands collapsible sidebar items if they match the current page.
 * 
 * 3. **Modal Handling**:
 *    - Adds event listeners to buttons with the class `.btn` to display a modal with the ID `myModal`.
 *    - Focuses on an input field with the ID `myInput` when the modal is shown.
 * 
 * 4. **Audio/Video Playback Control**:
 *    - Ensures only one audio or video element plays at a time by pausing all others when a new one starts playing.
 * 
 * 5. **Navbar Collapse**:
 *    - Collapses the navbar when a non-dropdown link is clicked.
 * 
 * 6. **Knowledge Check Feedback**:
 *    - Handles feedback display for multiple-choice questions.
 *    - Hides all feedback alerts in the question container when a radio button is clicked.
 *    - Displays the feedback corresponding to the selected answer.
 * 
 * 7. **Debugging and Logging**:
 *    - Logs the current page and the href attributes of navbar and sidebar items for debugging purposes.
 * 
 * **Event Listeners**:
 * - `DOMContentLoaded`: Initializes various functionalities when the DOM is fully loaded.
 * - `play`: Pauses all other audio/video elements when one starts playing.
 * - Click events for buttons, navbar links, and radio buttons to handle specific interactions.
 */
// JavaScript Document

// expand relative sidebar dropdown on page load
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  if (readCookie("coop")) {
    document.querySelector("div.container-fluid.bg-danger").style.display = "none";
  }

  var createCookie = function (name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toGMTString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
  };

  var readCookie = function (name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  var eraseCookie = function (name) {
    createCookie(name, '', -1);
  };

  function coopcookie() {
    createCookie("coop", "hidden");
  }

  document.querySelectorAll(".btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var modal = document.getElementById("myModal");
      if (modal) {
        modal.style.display = "block";
      }
    });
  });

  var myModal = document.getElementById('myModal');
  var myInput = document.getElementById('myInput');

  if (myModal) {
    myModal.addEventListener('shown.bs.modal', function () {
      if (myInput) {
        myInput.focus();
      }
    });
  }

  var currentPage = document.location.pathname.match(/[^\/]+$/)[0];
  console.log('currentPage: ' + currentPage);

  // loop through navbar items and highlight the one that matches the currentPage
  document.querySelectorAll('a.dropdown-item').forEach(function (item) {
    var currentItem = item.getAttribute('href');
    console.log('a.dropdown-item currentItem: ' + currentItem);
    if (currentItem === currentPage) {
      item.classList.add('active');
      return false;
    }
  });

  // loop through sidebar nav items and highlight the one that matches the currentPage
  document.querySelectorAll('a.nav-link').forEach(function (item) {
    var currentItem = item.getAttribute('href');
    console.log('a.nav-link currentItem: ' + currentItem);
    if (currentItem === currentPage) {
      item.classList.add('active');
    }
  });

  // loop through only the collapsible nav items
  document.querySelectorAll('#sidebar > ul.nav > li.nav-item > div.collapse ul.nav > li.nav-item > a.nav-link').forEach(function (item) {
    var currentItem = item.getAttribute('href');
    if (currentItem === currentPage) {
      var parent = item.closest('.collapse');
      if (parent) {
        var trigger = parent.previousElementSibling;
        if (trigger) {
          trigger.click();
        }
      }
      return false;
    }
  });
});

// Pause all other audio/video so only one is playing at a time
document.addEventListener('play', function (e) {
  "use strict";

  var audios = document.getElementsByTagName('audio');
  for (var i = 0, alen = audios.length; i < alen; i++) {
    if (audios[i] !== e.target) {
      audios[i].pause();
    }
  }

  var videos = document.getElementsByTagName('video');
  for (var j = 0, vlen = videos.length; j < vlen; j++) {
    if (videos[j] !== e.target) {
      videos[j].pause();
    }
  }
}, true);

// Collapse nav bar when item clicked
document.querySelectorAll('.navbar-nav li a').forEach(function (link) {
  link.addEventListener('click', function () {
    "use strict";
    if (!link.classList.contains('dropdown-toggle')) {
      var navbarCollapse = document.querySelector('.navbar-collapse');
      if (navbarCollapse) {
        navbarCollapse.classList.remove('show');
      }
    }
  });
});

// Show/Hide feedback for multiple choice Knowledge Check questions
document.querySelectorAll('input[type="radio"].orau-kcrb').forEach(function (radio) {
  radio.addEventListener('click', function () {
    'use strict';
    var qContainer = radio.closest('.question-container');
    if (qContainer) {
      qContainer.querySelectorAll('.feedback-container .alert').forEach(function (alert) {
        alert.style.display = 'none';
      });

      var answer = radio.value;
      var answerFBContainer = parseInt(answer);
      console.log('Selected answer: ' + answerFBContainer);

      var feedback = qContainer.querySelector('.feedback-container .alert:nth-child(' + answerFBContainer + ')');
      if (feedback) {
        feedback.style.display = 'block';
      }
    }
  });
});
