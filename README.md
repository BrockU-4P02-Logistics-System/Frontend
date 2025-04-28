<p align="center">
  <img src="./public/logo.png" alt="re-route Logo" width="200" />
</p>

# [Re-Route](https://re-route.ca) Frontend()

> Interactive mapping for multi-driver TSP routing (up to 10 drivers)

Re-Route is a React-based frontend for planning and optimizing routes across multiple drivers. With support for up to **10 drivers**, it offers a seamless UI with dark mode, persistent route management, secure payments, and easy sign-in options.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [Authentication](#authentication)
- [Payments](#payments)
- [Theming](#theming)
- [Route Management](#route-management)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## Features

- Multi-driver routing for up to 10 drivers
- Dark mode toggling
- Load and save routes locally or via user account
- Stripe-based credit purchases
- Google OAuth sign-in plus a custom email/password option

## Demo

Live demo and usage video coming soon.

## Tech Stack

- **Framework**: React (TypeScript)
- **State Management**: Redux Toolkit / Context API
- **Styling**: Tailwind CSS / Styled Components
- **Mapping**: Google Maps JavaScript API
- **Authentication**: Firebase Auth (Google) & custom solution
- **Payments**: Stripe.js & React Stripe Elements

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-org/re-route-frontend.git
cd re-route-frontend
npm install
```

## Usage

Start the development server:

```bash
npm start
```

Open `http://localhost:3000` in your browser.

Build for production:

```bash
npm run build
```

## Authentication

Users can sign in with their Google accounts or use a custom email/password workflow.

## Payments

Users purchase credits through Stripe. The frontend integrates Stripe Elements for secure checkout flows.

## Theming

Toggle between light and dark themes. Preferences persist across sessions.

## Route Management

Import and export route plans as JSON files or save them to your account.

## Configuration

Provide necessary API keys and other settings according to your team's deployment standards.

## Contributing

1. Fork the repository.
2. Create a branch:
   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit changes:
   ```bash
   git commit -m "Add feature"
   ```
4. Push branch:
   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request.

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

