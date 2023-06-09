'use strict';

const form = document.querySelector('.form');
const workoutContainer = document.querySelector('.workouts');
const inputType = document.querySelector('#workout__type');
const inputDistance = document.querySelector('#workout__distance');
const inputDuration = document.querySelector('#workout__duration');
const inputCadence = document.querySelector('#workout__cadence');
const inputElevation = document.querySelector('#workout__elevation');
let map, mapEvent;

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    const months = [
      'January',
      'Febuary',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    this.pace = this.distance / this.duration;
    return this.pace;
  }
}
class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevation) {
    super(coords, distance, duration);
    this.elevation = elevation;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    this.speed = this.distance / (this.duration * 60);
    return this.speed;
  }
}

class App {
  #workouts = [];
  #mapZoomLevel = 13;
  #map;
  #mapEvent;
  constructor() {
    //Get user's Position
    this._getPosition();

    // get data from local Storage
    this._getLocalStorage();

    // Handle events
    this._toggleElevationField();
    form.addEventListener('submit', this._newWorkout.bind(this));
    workoutContainer.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Cannot get current location');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    this.#map = L.map('map').setView([latitude, longitude], this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', this._showForm.bind(this));
    this.#workouts.forEach(element => {
      this._renderWorkoutTemplate(element);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(function () {
      form.style.display = 'grid';
    }, 1000);
  }

  _toggleElevationField() {
    inputType.addEventListener('change', function () {
      inputElevation
        .closest('.form__row')
        .classList.toggle('form__row--hidden');
      inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    });
  }

  _newWorkout(e) {
    e.preventDefault();
    const validInputs = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const allPositive = (...inputs) => inputs.every(input => input > 0);
    const { lat, lng } = this.#mapEvent.latlng;
    let newObj;
    //1 Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;

    //3 If workout running, create running object
    if (type == 'running') {
      const cadence = +inputCadence.value;
      //2 Check if input is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input must be a positive number');
      newObj = new Running([lat, lng], distance, duration, cadence);
    }

    //4 If workout cycling, create cycling object
    if (type == 'cycling') {
      const elevation = +inputElevation.value;
      //2 Check if input is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration, elevation)
      )
        return alert('Input must be a positive number');
      newObj = new Cycling([lat, lng], distance, duration, elevation);
    }

    //5 Add new object to workout array
    this.#workouts.push(newObj);

    //6 Render workout marker on map
    this._renderWorkoutTemplate(newObj);

    //7 Render workouts on list
    this._renderWorkout(newObj);

    //8 clear input feilds
    this._hideForm();

    //9 set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutTemplate(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minHeight: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type == 'running' ? '🏃' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout__${workout.type}" data-id="${
      workout.id
    }">
    <h2 class="workout__heading">${workout.description} </h2>
    <div class="workout__detail">
      <span class="workout__icon">${
        workout.type == 'running' ? '🏃' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">KM</span>
    </div>
    <div class="workout__detail">
      <span class="workout__icon">⏱️</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">MIN</span>
    </div>`;

    if (workout.type == 'running') {
      html += `<div class="workout__detail">
        <span class="workout__icon">⚡</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">MIN/KM</span>
      </div>
      <div class="workout__detail">
        <span class="workout__icon">👣</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">SPM</span>
      </div>
    </li>`;
    } else if (workout.type == 'cycling') {
      html += `<div class="workout__detail">
            <span class="workout__icon">⚡</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">KM/HR</span>
          </div>
          <div class="workout__detail">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevation}</span>
            <span class="workout__unit">M</span>
          </div>`;
    }
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest('.workout');
    if (!workoutEl || workoutEl === undefined) return;
    const workout = this.#workouts.find(
      work => work.id == +workoutEl.dataset.id
    );
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach(element => {
      // this._renderWorkoutTemplate(element);  // we need to call this after map is actually loaded
      this._renderWorkout(element);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
