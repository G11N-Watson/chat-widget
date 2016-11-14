/**
* (C) Copyright IBM Corp. 2016. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
* in compliance with the License. You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software distributed under the License
* is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
* or implied. See the License for the specific language governing permissions and limitations under
* the License.
*/

var IBMChat = require('@watson-virtual-agent/chat-widget');
require('./styles.css');


/*
  Custom Choose Layout
*/

var widgets = [];
var templates = {
  button: '<button style="background-color: yellow;" class="IBMChat-accent-colors-button" data-input="${text}" data-custom-layout=true>${text}</button>',
  dropdown: '<div class="select" tabindex="1"></div>',
  option:
  '<input id="${optionId}" class="selectopt" name="test" type="radio"> <label for="${optionId}" class="option">${label}</label>'
};

function layoutInit() {
  IBMChat.subscribe('layout:choose', function(data) {
    var widget = new Choose(data);
    widgets[data.uuid] = widget;
  });
  IBMChat.subscribe('layout:confirm', function(data) {
    var widget = new Choose(data);
    widgets[data.uuid] = widget;
  });
}

function Choose(data) {
  this.init(data);
}

Choose.prototype.init = function(data) {
  this.allowMultiple = (data.message.inputvalidation.someOf !== undefined);
  this.values = [];
  this.eventListeners = [];
  this.data = (this.allowMultiple) ? data.message.inputvalidation.someOf : data.message.inputvalidation.oneOf;
  this.uuid = data.uuid;
  this.layoutElement = data.layoutElement;
  this.msgElement = data.msgElement;
  this.drawDropdown();
  this.subscribeSend = IBMChat.subscribe('send', this.removeAllEventListeners.bind(this));
};


Choose.prototype.drawDropdown = function() {
  // main dropdown container
  this.el = document.createElement('div');
  this.el.classList.add('dropdown');
  this.el.setAttribute('data-isopen', false);

  // button to display/hide options
  var buttonEl = document.createElement('button');
  buttonEl.classList.add('selected-option');
  buttonEl.innerHTML = this.data[0];
  buttonEl.addEventListener('click', this.handleDropdownClick.bind(this));
  this.eventListeners.push({ el: buttonEl, cb: this.handleDropdownClick.bind(this) });
  this.el.append(buttonEl);

  // dropdown options
  var ulEl = document.createElement('ul');
  ulEl.classList.add('options-container');
  for (var i = 0; i < this.data.length; i++) {
    var liEl = document.createElement('li');
    liEl.classList.add('option');
    liEl.innerHTML = this.data[i];
    liEl.addEventListener('click', this.handleOptionClick.bind(this));
    this.eventListeners.push({ el: liEl, cb: this.handleOptionClick.bind(this) });
    if (i === 0)
      liEl.setAttribute('data-selected', true);
    else
      liEl.setAttribute('data-selected', false);
    ulEl.append(liEl);
  }
  this.el.append(ulEl);

  // append dropdown to
  this.layoutElement.append(this.el);

  // hide all options on creation
  this.hideOptions();
};

Choose.prototype.handleDropdownClick = function(e) {
  var isOpen = (this.el.dataset.isopen === 'true');
  if (!isOpen)
    this.showOptions();
  else
    this.hideOptions();
  this.el.setAttribute('data-isopen', !isOpen);
};

Choose.prototype.handleOptionClick = function(e) {
  this.hideOptions();
  // remove current selection
  var current = this.el.querySelector('[data-selected="true"]');
  current.dataset.selected = false;
  // set new selected option
  var target = e.target;
  target.setAttribute('data-selected', true);
  var button = this.el.querySelector('.selected-option');
  button.innerHTML = target.innerHTML;

  IBMChat.publish('scroll-to-bottom');

  this.submit();
};

Choose.prototype.hideOptions = function() {
  var ul = this.el.querySelector('.options-container');
  ul.style.display = 'none';
};

Choose.prototype.showOptions = function() {
  var ul = this.el.querySelector('.options-container');
  ul.style.display = '';
};

Choose.prototype.submit = function() {
  var current = this.el.querySelector('[data-selected="true"]');
  this.values.push(current.innerHTML);
  IBMChat.publish('send', {
    silent: true,
    text: this.values.toString()
  });
  this.el.disabled = true;
};

Choose.prototype.removeAllEventListeners = function() {
  if (this.eventListeners.length > 0) {
    for (var i = 0; i < this.eventListeners.length; i++) {
      this.eventListeners[i].el.removeEventListener('click', this.eventListeners[i].cb);
      this.eventListeners[i].el.setAttribute('disabled', true);
    }
    this.eventListeners = [];
    this.subscribeSend.remove();
  }
};


// register the custom choose layout overriding the default 'choose' layout, passing
// the init function
IBMChat.registerLayout('choose', layoutInit);

// initialize chat widget. Set botID, XIBMClientID and XIBMClientSecret
// with the corresponding values
IBMChat.init({
  el: 'ibm_el',
  baseURL: 'https://api.ibm.com/virtualagent/run/api/v1/',
  botID: 'ab6b87d9-ec6b-448a-be3b-037edf36e3e1',
  XIBMClientID: 'a9020123-6dd1-4894-bfd2-45d69ad5b1cd',
  XIBMClientSecret: 'X1sJ7uR0lI4gM8wV3iS1hK7jI2kC3hU5jE8nO2oY8kB1oW5cG1'
});
