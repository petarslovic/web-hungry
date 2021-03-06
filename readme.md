# Hungry

Hungry is a web app for ordering food. Intended use - Cosmic Development Belgrade.

## Technology

- Laravel Back End
- Angular Front End

## Features

### User

- [x] User views the daily menu
- [x] User orders food for each day of the week
- [ ] User likes foods
- [ ] User sees the most popular foods
- [x] User gets email reminders to ordered food

### Admin

- [x] Admin manages foods
- [x] Admin can mark food as a default food
- [x] Admin makes daily menu
- [x] Admin publishes menus for a week
- [x] Admin sees who ordered what, who didn't order, etc
- @include User

### Super Admin

- [x] Super Admin manages users
- @include Admin

Happy coding!

## Starting the project

`composer install`

`touch .env`  
Fill out .env file with appropriate values

`php artisan migrate`

`sudo npm i`

`bower install`

`gulp`