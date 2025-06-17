# Selection Sort Visualizer

A visual representation of the selection sort algorithm using D3.js. This project demonstrates how selection sort works by animating the sorting process with bar charts.

## Features

- Visual representation of selection sort algorithm
- Interactive controls to generate new arrays and start sorting
- Smooth animations showing the sorting process
- Highlighted bars to show current comparisons and swaps

## Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed
2. Install pnpm if you haven't already:
   ```bash
   npm install -g pnpm
   ```
3. Clone this repository
4. Install dependencies:
   ```bash
   pnpm install
   ```

## Running the Project

You can start the development server using:

```bash
pnpm dev
```

This will start a local server at `http://localhost:3000`. Open this URL in your browser to see the visualization.

Alternatively, you can use other static file servers:

```bash
# Using Python's built-in server
python -m http.server

# Using Node's http-server directly
npx http-server
```

## Usage

1. Click "Generate New Array" to create a new random array
2. Click "Start Sorting" to begin the selection sort visualization
3. Watch as the bars are compared and swapped to sort the array

## Technologies Used

- D3.js for visualization
- Modern JavaScript (ES6+)
- HTML5 and CSS3
