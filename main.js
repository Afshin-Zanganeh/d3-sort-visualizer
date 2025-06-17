import * as d3 from 'd3';

// Configuration
let ARRAY_SIZE = 15;
const MIN_VALUE = 5;
const MAX_VALUE = 100;
let BAR_ANIMATION_DELAY = 1000; // For bar movement
let COLOR_ANIMATION_DELAY = 300; // For color changes

// Color constants
const COLOR_DEFAULT = '#1976D2'; // Modern blue
const COLOR_COMPARE = '#2196F3'; // Lighter blue for compared bars
const COLOR_MIN = '#FF9800';     // Orange for current min
const COLOR_CURRENT = '#E91E63'; // Pink for current bar
const COLOR_SWAP = '#9C27B0';    // Purple for swap

// Visualizer class
class Visualizer {
    constructor({containerId, algo}) {
        this.containerId = containerId;
        this.algo = algo;
        this.array = [];
        this.isSorting = false;
        this.stopRequested = false;
        this.nextId = 0;
        this.svg = null;
        this.x = null;
        this.y = null;
        this.width = 250;
        this.height = 300;
        this.margin = { top: 20, right: 10, bottom: 30, left: 10 };
        this.init();
    }
    init() {
        d3.select(`#${this.containerId}`).selectAll('*').remove();
        this.svg = d3.select(`#${this.containerId}`)
            .append('svg')
            .attr('width', this.width + this.margin.left + this.margin.right)
            .attr('height', this.height + this.margin.top + this.margin.bottom)
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);
        this.x = d3.scaleBand().range([0, this.width]).padding(0.1);
        this.y = d3.scaleLinear().range([this.height, 0]);
    }
    setArray(array) {
        this.nextId = 0;
        this.array = array.map(v => ({ value: v, id: this.nextId++ }));
        this.updateVisualization();
    }
    updateVisualization(highlightedIndices = [], animateBars = true, animateColor = true, minIdx = null, currentIdx = null, swapIndices = []) {
        this.x.domain(this.array.map((_, i) => i));
        this.y.domain([0, d3.max(this.array, d => d.value)]);
        // Bars
        const bars = this.svg.selectAll('.bar')
            .data(this.array, d => d.id);
        bars.exit().remove();
        const newBars = bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', (_, i) => this.x(i))
            .attr('width', this.x.bandwidth())
            .attr('y', this.height)
            .attr('height', 0)
            .attr('rx', 4)
            .attr('fill', (_, i) => getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));
        const mergedBars = bars.merge(newBars);
        if (animateBars) {
            mergedBars.transition()
                .duration(BAR_ANIMATION_DELAY)
                .attr('x', (_, i) => this.x(i))
                .attr('width', this.x.bandwidth())
                .attr('y', d => this.y(d.value))
                .attr('height', d => this.height - this.y(d.value))
                .attr('fill', (_, i) => getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));
        } else if (animateColor) {
            mergedBars
                .attr('x', (_, i) => this.x(i))
                .attr('width', this.x.bandwidth())
                .attr('y', d => this.y(d.value))
                .attr('height', d => this.height - this.y(d.value))
                .transition()
                .duration(COLOR_ANIMATION_DELAY)
                .attr('fill', (_, i) => getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));
        } else {
            mergedBars
                .attr('x', (_, i) => this.x(i))
                .attr('width', this.x.bandwidth())
                .attr('y', d => this.y(d.value))
                .attr('height', d => this.height - this.y(d.value))
                .attr('fill', (_, i) => getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));
        }
        // Remove old labels
        this.svg.selectAll('.bar-label').data(this.array, d => d.id).exit().remove();
        // Add new labels
        const labels = this.svg.selectAll('.bar-label')
            .data(this.array, d => d.id);
        labels.enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('text-anchor', 'middle')
            .attr('x', (_, i) => this.x(i) + this.x.bandwidth() / 2)
            .attr('y', d => this.y(d.value) + 16)
            .text(d => d.value);
        if (animateBars) {
            labels.transition()
                .duration(BAR_ANIMATION_DELAY)
                .attr('x', (_, i) => this.x(i) + this.x.bandwidth() / 2)
                .attr('y', d => this.y(d.value) + 16)
                .text(d => d.value);
        } else {
            labels
                .attr('x', (_, i) => this.x(i) + this.x.bandwidth() / 2)
                .attr('y', d => this.y(d.value) + 16)
                .text(d => d.value);
        }
    }
    async startSort() {
        if (this.isSorting) return;
        this.isSorting = true;
        this.stopRequested = false;
        await this.algo(this);
        this.isSorting = false;
    }
    stopSort() {
        this.stopRequested = true;
    }
}

function getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices = []) {
    if (swapIndices.includes(i)) return COLOR_SWAP;
    if (i === currentIdx) return COLOR_CURRENT;
    if (i === minIdx) return COLOR_MIN;
    if (highlightedIndices.includes(i)) return COLOR_COMPARE;
    return COLOR_DEFAULT;
}

// Sorting algorithms
async function selectionSort(visualizer) {
    for (let i = 0; i < visualizer.array.length - 1; i++) {
        if (visualizer.stopRequested) break;
        let minIdx = i;
        for (let j = i + 1; j < visualizer.array.length; j++) {
            if (visualizer.stopRequested) break;
            visualizer.updateVisualization([j], false, true, minIdx, i);
            await new Promise(resolve => setTimeout(resolve, COLOR_ANIMATION_DELAY));
            if (visualizer.array[j].value < visualizer.array[minIdx].value) {
                minIdx = j;
            }
        }
        if (visualizer.stopRequested) break;
        if (minIdx !== i) {
            visualizer.updateVisualization([], false, true, null, null, [i, minIdx]);
            await new Promise(resolve => setTimeout(resolve, COLOR_ANIMATION_DELAY));
            [visualizer.array[i], visualizer.array[minIdx]] = [visualizer.array[minIdx], visualizer.array[i]];
            visualizer.updateVisualization([], true, false, null, null, [i, minIdx]);
            await new Promise(resolve => setTimeout(resolve, BAR_ANIMATION_DELAY));
        }
    }
    visualizer.updateVisualization();
}

async function bubbleSort(visualizer) {
    let n = visualizer.array.length;
    for (let i = 0; i < n - 1; i++) {
        if (visualizer.stopRequested) break;
        for (let j = 0; j < n - i - 1; j++) {
            if (visualizer.stopRequested) break;
            visualizer.updateVisualization([j, j + 1], false, true, null, j);
            await new Promise(resolve => setTimeout(resolve, COLOR_ANIMATION_DELAY));
            if (visualizer.array[j].value > visualizer.array[j + 1].value) {
                visualizer.updateVisualization([], false, true, null, null, [j, j + 1]);
                await new Promise(resolve => setTimeout(resolve, COLOR_ANIMATION_DELAY));
                [visualizer.array[j], visualizer.array[j + 1]] = [visualizer.array[j + 1], visualizer.array[j]];
                visualizer.updateVisualization([], true, false, null, null, [j, j + 1]);
                await new Promise(resolve => setTimeout(resolve, BAR_ANIMATION_DELAY));
            }
        }
    }
    visualizer.updateVisualization();
}

async function insertionSort(visualizer) {
    let n = visualizer.array.length;
    for (let i = 1; i < n; i++) {
        if (visualizer.stopRequested) break;
        let j = i;
        while (j > 0 && visualizer.array[j - 1].value > visualizer.array[j].value) {
            if (visualizer.stopRequested) break;
            // Highlight the two bars to be swapped
            visualizer.updateVisualization([], false, true, null, null, [j, j - 1]);
            await new Promise(resolve => setTimeout(resolve, COLOR_ANIMATION_DELAY));
            // Swap and animate
            [visualizer.array[j], visualizer.array[j - 1]] = [visualizer.array[j - 1], visualizer.array[j]];
            visualizer.updateVisualization([], true, false, null, null, [j, j - 1]);
            await new Promise(resolve => setTimeout(resolve, BAR_ANIMATION_DELAY));
            j--;
        }
        visualizer.updateVisualization();
    }
    visualizer.updateVisualization();
}

// Create visualizers
const selectionVis = new Visualizer({
    containerId: 'visualization-selection',
    algo: selectionSort
});
const bubbleVis = new Visualizer({
    containerId: 'visualization-bubble',
    algo: bubbleSort
});
const insertionVis = new Visualizer({
    containerId: 'visualization-insertion',
    algo: insertionSort
});

// Generate and set array for all visualizers
function generateAndSetArray() {
    const arr = Array.from({ length: ARRAY_SIZE }, () => Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE);
    selectionVis.setArray(arr);
    bubbleVis.setArray(arr);
    insertionVis.setArray(arr);
}
document.getElementById('generate').addEventListener('click', () => {
    generateAndSetArray();
    document.getElementById('sort-all').disabled = false;
    document.getElementById('stop-all').disabled = true;
});

document.getElementById('sort-all').addEventListener('click', async () => {
    document.getElementById('sort-all').disabled = true;
    document.getElementById('stop-all').disabled = false;
    // Start all sorts in parallel
    await Promise.all([
        selectionVis.startSort(),
        bubbleVis.startSort(),
        insertionVis.startSort()
    ]);
    document.getElementById('sort-all').disabled = false;
    document.getElementById('stop-all').disabled = true;
});

document.getElementById('stop-all').addEventListener('click', () => {
    selectionVis.stopSort();
    bubbleVis.stopSort();
    insertionVis.stopSort();
    document.getElementById('sort-all').disabled = false;
    document.getElementById('stop-all').disabled = true;
});

document.getElementById('sort-all').disabled = false;
document.getElementById('stop-all').disabled = true;

generateAndSetArray();

// Add this at the end of the file to handle the speed slider
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', (e) => {
        BAR_ANIMATION_DELAY = Number(speedSlider.value);
        // Optionally, color animation can scale with bar animation
        COLOR_ANIMATION_DELAY = Math.max(50, Math.floor(BAR_ANIMATION_DELAY * 0.3));
        speedValue.textContent = `${BAR_ANIMATION_DELAY} ms`;
    });
}

// Handle array size input
const arraySizeInput = document.getElementById('array-size-input');
const setArraySizeBtn = document.getElementById('set-array-size');
if (arraySizeInput && setArraySizeBtn) {
    setArraySizeBtn.addEventListener('click', () => {
        const val = Number(arraySizeInput.value);
        if (isNaN(val) || val < 2 || val > 50) {
            alert('Array size must be between 2 and 50.');
            return;
        }
        ARRAY_SIZE = val;
        generateAndSetArray();
    });
}

// Handle manual array input
const manualInput = document.getElementById('array-manual-input');
const setManualArrayBtn = document.getElementById('set-manual-array');
if (manualInput && setManualArrayBtn) {
    setManualArrayBtn.addEventListener('click', () => {
        const arr = manualInput.value.split(',').map(s => Number(s.trim())).filter(v => !isNaN(v));
        if (arr.length < 2) {
            alert('Please enter at least 2 valid numbers, separated by commas.');
            return;
        }
        if (arr.length > 50) {
            alert('Maximum array length is 50.');
            return;
        }
        if (arr.some(v => v < MIN_VALUE || v > MAX_VALUE)) {
            alert(`All values must be between ${MIN_VALUE} and ${MAX_VALUE}.`);
            return;
        }
        selectionVis.setArray(arr);
        bubbleVis.setArray(arr);
        insertionVis.setArray(arr);
    });
} 