```markdown
# re-route Frontend

re-route is a React-based frontend application for a multi-driver Traveling Salesperson Problem (TSP) mapping platform. It supports routing up to 10 drivers and offers features such as dark mode, persistent route management, payment handling, and user authentication.

## Table of Contents

- Features
- Demo
- Tech Stack
- Installation
- Usage
- Authentication
- Payments
- Theming
- Route Management
- Configuration
- Contributing
- License

## Features

- Multi-driver routing for up to 10 drivers
- Dark mode toggling
- Load and save routes locally or via user account
- Stripe-based credit purchases
- Google OAuth sign-in plus a custom email/password option

## Demo

Live demo and usage video coming soon.

## Tech Stack

- React (TypeScript)
- State management: Redux Toolkit / Context API
- Styling: Tailwind CSS / Styled Components
- Mapping: Google Maps JavaScript API
- Authentication: Firebase Auth (Google) & custom solution
- Payments: Stripe.js & React Stripe Elements

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

Open http://localhost:3000 in your browser.

Build for production:

```bash
npm run build
```

## Authentication

Users can sign in with Google accounts or use a custom email and password workflow.

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
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push branch: `git push origin feature/your-feature`
5. Open a pull request.

## License

This project is licensed under the Apache 2.0. See the LICENSE file for details.
```

