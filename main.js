import * as d3 from 'd3';

// Configuration
const CONFIG = {
    ARRAY_SIZE: 15,
    MIN_VALUE: 5,
    MAX_VALUE: 100,
    BAR_ANIMATION_DELAY: 1000,
    COLOR_ANIMATION_DELAY: 300,
    COLORS: {
        DEFAULT: '#1976D2',
        COMPARE: '#2196F3',
        MIN: '#FF9800',
        CURRENT: '#E91E63',
        SWAP: '#9C27B0'
    }
};

// Visualizer class
class Visualizer {
    constructor({ containerId, algo }) {
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

    updateVisualization({ 
        highlightedIndices = [], 
        animateBars = true, 
        animateColor = true, 
        minIdx = null, 
        currentIdx = null, 
        swapIndices = [] 
    } = {}) {
        this.x.domain(this.array.map((_, i) => i));
        this.y.domain([0, d3.max(this.array, d => d.value)]);

        this.updateBars({ highlightedIndices, animateBars, animateColor, minIdx, currentIdx, swapIndices });
        this.updateLabels({ animateBars });
    }

    updateBars({ highlightedIndices, animateBars, animateColor, minIdx, currentIdx, swapIndices }) {
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
            .attr('fill', (_, i) => this.getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));

        const mergedBars = bars.merge(newBars);
        
        if (animateBars) {
            this.animateBars(mergedBars, highlightedIndices, minIdx, currentIdx, swapIndices);
        } else if (animateColor) {
            this.animateColors(mergedBars, highlightedIndices, minIdx, currentIdx, swapIndices);
        } else {
            this.updateBarAttributes(mergedBars, highlightedIndices, minIdx, currentIdx, swapIndices);
        }
    }

    updateLabels({ animateBars }) {
        this.svg.selectAll('.bar-label').data(this.array, d => d.id).exit().remove();
        
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
            this.animateLabels(labels);
        } else {
            this.updateLabelAttributes(labels);
        }
    }

    getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices = []) {
        if (swapIndices.includes(i)) return CONFIG.COLORS.SWAP;
        if (i === currentIdx) return CONFIG.COLORS.CURRENT;
        if (i === minIdx) return CONFIG.COLORS.MIN;
        if (highlightedIndices.includes(i)) return CONFIG.COLORS.COMPARE;
        return CONFIG.COLORS.DEFAULT;
    }

    animateBars(bars, highlightedIndices, minIdx, currentIdx, swapIndices) {
        bars.transition()
            .duration(CONFIG.BAR_ANIMATION_DELAY)
            .attr('x', (_, i) => this.x(i))
            .attr('width', this.x.bandwidth())
            .attr('y', d => this.y(d.value))
            .attr('height', d => this.height - this.y(d.value))
            .attr('fill', (_, i) => this.getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));
    }

    animateColors(bars, highlightedIndices, minIdx, currentIdx, swapIndices) {
        bars
            .attr('x', (_, i) => this.x(i))
            .attr('width', this.x.bandwidth())
            .attr('y', d => this.y(d.value))
            .attr('height', d => this.height - this.y(d.value))
            .transition()
            .duration(CONFIG.COLOR_ANIMATION_DELAY)
            .attr('fill', (_, i) => this.getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));
    }

    updateBarAttributes(bars, highlightedIndices, minIdx, currentIdx, swapIndices) {
        bars
            .attr('x', (_, i) => this.x(i))
            .attr('width', this.x.bandwidth())
            .attr('y', d => this.y(d.value))
            .attr('height', d => this.height - this.y(d.value))
            .attr('fill', (_, i) => this.getBarColor(i, highlightedIndices, minIdx, currentIdx, swapIndices));
    }

    animateLabels(labels) {
        labels.transition()
            .duration(CONFIG.BAR_ANIMATION_DELAY)
            .attr('x', (_, i) => this.x(i) + this.x.bandwidth() / 2)
            .attr('y', d => this.y(d.value) + 16)
            .text(d => d.value);
    }

    updateLabelAttributes(labels) {
        labels
            .attr('x', (_, i) => this.x(i) + this.x.bandwidth() / 2)
            .attr('y', d => this.y(d.value) + 16)
            .text(d => d.value);
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

// Sorting algorithms
async function selectionSort(visualizer) {
    for (let i = 0; i < visualizer.array.length - 1; i++) {
        if (visualizer.stopRequested) break;
        let minIdx = i;
        
        for (let j = i + 1; j < visualizer.array.length; j++) {
            if (visualizer.stopRequested) break;
            
            visualizer.updateVisualization({
                highlightedIndices: [j],
                animateBars: false,
                animateColor: true,
                minIdx,
                currentIdx: i
            });
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.COLOR_ANIMATION_DELAY));
            
            if (visualizer.array[j].value < visualizer.array[minIdx].value) {
                minIdx = j;
            }
        }

        if (visualizer.stopRequested) break;
        
        if (minIdx !== i) {
            visualizer.updateVisualization({
                animateBars: false,
                animateColor: true,
                swapIndices: [i, minIdx]
            });
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.COLOR_ANIMATION_DELAY));
            
            [visualizer.array[i], visualizer.array[minIdx]] = [visualizer.array[minIdx], visualizer.array[i]];
            
            visualizer.updateVisualization({
                animateBars: true,
                animateColor: false,
                swapIndices: [i, minIdx]
            });
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.BAR_ANIMATION_DELAY));
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
            
            visualizer.updateVisualization({
                highlightedIndices: [j, j + 1],
                animateBars: false,
                animateColor: true,
                currentIdx: j
            });
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.COLOR_ANIMATION_DELAY));
            
            if (visualizer.array[j].value > visualizer.array[j + 1].value) {
                visualizer.updateVisualization({
                    animateBars: false,
                    animateColor: true,
                    swapIndices: [j, j + 1]
                });
                
                await new Promise(resolve => setTimeout(resolve, CONFIG.COLOR_ANIMATION_DELAY));
                
                [visualizer.array[j], visualizer.array[j + 1]] = [visualizer.array[j + 1], visualizer.array[j]];
                
                visualizer.updateVisualization({
                    animateBars: true,
                    animateColor: false,
                    swapIndices: [j, j + 1]
                });
                
                await new Promise(resolve => setTimeout(resolve, CONFIG.BAR_ANIMATION_DELAY));
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
            
            visualizer.updateVisualization({
                animateBars: false,
                animateColor: true,
                swapIndices: [j, j - 1]
            });
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.COLOR_ANIMATION_DELAY));
            
            [visualizer.array[j], visualizer.array[j - 1]] = [visualizer.array[j - 1], visualizer.array[j]];
            
            visualizer.updateVisualization({
                animateBars: true,
                animateColor: false,
                swapIndices: [j, j - 1]
            });
            
            await new Promise(resolve => setTimeout(resolve, CONFIG.BAR_ANIMATION_DELAY));
            j--;
        }
        visualizer.updateVisualization();
    }
    visualizer.updateVisualization();
}

// Create visualizers
const visualizers = {
    selection: new Visualizer({
        containerId: 'visualization-selection',
        algo: selectionSort
    }),
    bubble: new Visualizer({
        containerId: 'visualization-bubble',
        algo: bubbleSort
    }),
    insertion: new Visualizer({
        containerId: 'visualization-insertion',
        algo: insertionSort
    })
};

// Generate and set array for all visualizers
function generateAndSetArray() {
    const arr = Array.from(
        { length: CONFIG.ARRAY_SIZE }, 
        () => Math.floor(Math.random() * (CONFIG.MAX_VALUE - CONFIG.MIN_VALUE + 1)) + CONFIG.MIN_VALUE
    );
    
    Object.values(visualizers).forEach(vis => vis.setArray(arr));
}

// Event Handlers
function setupEventHandlers() {
    document.getElementById('generate').addEventListener('click', () => {
        generateAndSetArray();
        document.getElementById('sort-all').disabled = false;
        document.getElementById('stop-all').disabled = true;
    });

    document.getElementById('sort-all').addEventListener('click', async () => {
        document.getElementById('sort-all').disabled = true;
        document.getElementById('stop-all').disabled = false;
        
        await Promise.all(
            Object.values(visualizers).map(vis => vis.startSort())
        );
        
        document.getElementById('sort-all').disabled = false;
        document.getElementById('stop-all').disabled = true;
    });

    document.getElementById('stop-all').addEventListener('click', () => {
        Object.values(visualizers).forEach(vis => vis.stopSort());
        document.getElementById('sort-all').disabled = false;
        document.getElementById('stop-all').disabled = true;
    });

    // Speed slider
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    if (speedSlider && speedValue) {
        speedSlider.addEventListener('input', (e) => {
            CONFIG.BAR_ANIMATION_DELAY = Number(speedSlider.value);
            CONFIG.COLOR_ANIMATION_DELAY = Math.max(50, Math.floor(CONFIG.BAR_ANIMATION_DELAY * 0.3));
            speedValue.textContent = `${CONFIG.BAR_ANIMATION_DELAY} ms`;
        });
    }

    // Array size input
    const arraySizeInput = document.getElementById('array-size-input');
    const setArraySizeBtn = document.getElementById('set-array-size');
    if (arraySizeInput && setArraySizeBtn) {
        setArraySizeBtn.addEventListener('click', () => {
            const val = Number(arraySizeInput.value);
            if (isNaN(val) || val < 2 || val > 50) {
                alert('Array size must be between 2 and 50.');
                return;
            }
            CONFIG.ARRAY_SIZE = val;
            generateAndSetArray();
        });
    }

    // Manual array input
    const manualInput = document.getElementById('array-manual-input');
    const setManualArrayBtn = document.getElementById('set-manual-array');
    if (manualInput && setManualArrayBtn) {
        setManualArrayBtn.addEventListener('click', () => {
            const arr = manualInput.value
                .split(',')
                .map(s => Number(s.trim()))
                .filter(v => !isNaN(v));

            if (arr.length < 2) {
                alert('Please enter at least 2 valid numbers, separated by commas.');
                return;
            }
            if (arr.length > 50) {
                alert('Maximum array length is 50.');
                return;
            }
            if (arr.some(v => v < CONFIG.MIN_VALUE || v > CONFIG.MAX_VALUE)) {
                alert(`All values must be between ${CONFIG.MIN_VALUE} and ${CONFIG.MAX_VALUE}.`);
                return;
            }

            Object.values(visualizers).forEach(vis => vis.setArray(arr));
        });
    }
}

// Initialize
document.getElementById('sort-all').disabled = false;
document.getElementById('stop-all').disabled = true;
setupEventHandlers();
generateAndSetArray(); 