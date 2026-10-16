# Smartprep Kitchen Ai

Build a modern, professional web application called SmartPrep AI — Restaurant Food Waste Prevention System for a college business analytics project.

Business problem: Restaurants prepare too much food when demand is estimated incorrectly, resulting in avoidable food waste and financial losses.

Design: Create a polished restaurant operations dashboard with a clean cream-and-green color palette, modern cards, readable charts, and responsive desktop and mobile layouts.

Pages and features:

Dashboard: Show predicted orders, recommended preparation quantities, meals at high risk of surplus, and an estimated surplus indicator.

Demand Forecasting: Allow users to select a meal, fulfilment centre, week, promotion status, discount, selling price, and special-event status. Display predicted demand and a comparison chart.

Preparation Planner: Recommend how many units to prepare using predicted demand and a configurable safety buffer. Allow the manager to adjust the buffer.

Waste Risk Alerts: Highlight meals with potential overproduction risk and explain why the manager should review their preparation quantities.

Data Analytics: Display charts comparing demand across meals, centres, weeks, promotions, and special events.

Dataset Upload: Allow the user to upload a CSV file and preview its rows and columns.

Use the SmartPrep AI restaurant dataset, which contains 720 synthetic records. Clearly label all sample data and simulated waste estimates as synthetic, not real restaurant measurements.

Use Orders as the demand prediction target. Do not use simulated preparation, overproduction, shortage, or suggested-preparation columns as prediction inputs. Do not pretend a real machine-learning model is connected if it is not.

For the initial prototype, implement an interactive demonstration using the uploaded dataset and clearly label any demo predictions. Structure the app so a trained Linear Regression or Random Forest model from Orange can be integrated later. Include a model-performance section for MAE and RMSE, but do not invent performance scores.

Make the buttons, filters, charts, and preparation planner functional. Include a short explanation of how demand forecasting can help reduce over-preparation, plus a note that actual waste reduction must be measured using real restaurant data.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smartprep-kitchen-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/28200413-bc46-5a08-8a7d-dcc949954456).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
