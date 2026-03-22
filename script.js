document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let isRunning = false;
    let currentBucketLevel = 0;
    let totalReceived = 0;
    let totalDropped = 0;
    let simulationInterval = null;
    let time = 0;

    // --- DOM Elements ---
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');

    const arrivalRateSlider = document.getElementById('arrivalRate');
    const bucketCapacitySlider = document.getElementById('bucketCapacity');
    const leakRateSlider = document.getElementById('leakRate');

    const arrivalRateVal = document.getElementById('arrivalRateVal');
    const bucketCapacityVal = document.getElementById('bucketCapacityVal');
    const leakRateVal = document.getElementById('leakRateVal');

    const bucketFill = document.getElementById('bucketFill');
    const currentLevelText = document.getElementById('currentLevelText');
    const maxCapacityText = document.getElementById('maxCapacityText');
    const bucketElement = document.getElementById('bucket');

    const totalReceivedEl = document.getElementById('totalReceived');
    const totalDroppedEl = document.getElementById('totalDropped');
    const currentLevelEl = document.getElementById('currentLevel');
    const outputRateEl = document.getElementById('outputRate');

    const incomingContainer = document.getElementById('incomingPackets');
    const outgoingContainer = document.getElementById('outgoingPackets');
    const droppedContainer = document.getElementById('droppedPackets');

    // --- Chart.js Setup ---
    const ctx = document.getElementById('trafficChart').getContext('2d');
    const trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Incoming Rate',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Outgoing Rate',
                    data: [],
                    borderColor: '#2af598',
                    backgroundColor: 'rgba(42, 245, 152, 0.2)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.7)' }
                }
            },
            animation: false
        }
    });

    // --- Event Listeners ---
    startBtn.addEventListener('click', startSimulation);
    pauseBtn.addEventListener('click', pauseSimulation);
    resetBtn.addEventListener('click', resetSimulation);

    arrivalRateSlider.addEventListener('input', () => {
        arrivalRateVal.textContent = arrivalRateSlider.value;
    });

    bucketCapacitySlider.addEventListener('input', () => {
        bucketCapacityVal.textContent = bucketCapacitySlider.value;
        maxCapacityText.textContent = bucketCapacitySlider.value;
        updateBucketUI();
    });

    leakRateSlider.addEventListener('input', () => {
        leakRateVal.textContent = leakRateSlider.value;
        outputRateEl.textContent = leakRateSlider.value;
    });

    // --- Core Logic ---

    function startSimulation() {
        if (isRunning) return;
        isRunning = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        simulationInterval = setInterval(update, 1000); // Update every second
    }

    function pauseSimulation() {
        isRunning = false;
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        clearInterval(simulationInterval);
    }

    function resetSimulation() {
        pauseSimulation();
        currentBucketLevel = 0;
        totalReceived = 0;
        totalDropped = 0;
        time = 0;
        
        trafficChart.data.labels = [];
        trafficChart.data.datasets[0].data = [];
        trafficChart.data.datasets[1].data = [];
        trafficChart.update();

        updateMetrics();
        updateBucketUI();
        
        // Clear animations
        incomingContainer.innerHTML = '';
        outgoingContainer.innerHTML = '';
        droppedContainer.innerHTML = '';
    }

    function update() {
        const arrivalRate = parseInt(arrivalRateSlider.value);
        const capacity = parseInt(bucketCapacitySlider.value);
        const leakRate = parseInt(leakRateSlider.value);

        // 1. Process Incoming Packets
        totalReceived += arrivalRate;
        for (let i = 0; i < arrivalRate; i++) {
            createPacketAnimation('incoming');
        }

        // 2. Add to Bucket & Check Overflow
        const spaceLeft = capacity - currentBucketLevel;
        const accepted = Math.min(arrivalRate, spaceLeft);
        const dropped = arrivalRate - accepted;

        currentBucketLevel += accepted;
        totalDropped += dropped;

        if (dropped > 0) {
            for (let i = 0; i < dropped; i++) {
                createPacketAnimation('dropped');
            }
        }

        // 3. Process Leakage (Outgoing)
        const outgoing = Math.min(currentBucketLevel, leakRate);
        currentBucketLevel -= outgoing;

        if (outgoing > 0) {
            for (let i = 0; i < outgoing; i++) {
                setTimeout(() => createPacketAnimation('outgoing'), i * (1000 / outgoing));
            }
        }

        // 4. Update UI & Chart
        time++;
        updateMetrics(outgoing);
        updateBucketUI();
        updateChart(arrivalRate, outgoing);
    }

    function updateMetrics(currentOutputRate = 0) {
        totalReceivedEl.textContent = totalReceived;
        totalDroppedEl.textContent = totalDropped;
        currentLevelEl.textContent = Math.round(currentBucketLevel);
        outputRateEl.textContent = currentOutputRate;
        currentLevelText.textContent = Math.round(currentBucketLevel);
    }

    function updateBucketUI() {
        const capacity = parseInt(bucketCapacitySlider.value);
        const percentage = (currentBucketLevel / capacity) * 100;
        bucketFill.style.height = `${percentage}%`;
        
        if (percentage > 90) {
            bucketFill.style.background = 'var(--danger-gradient)';
        } else {
            bucketFill.style.background = 'var(--primary-gradient)';
        }
    }

    function updateChart(incoming, outgoing) {
        trafficChart.data.labels.push(time);
        trafficChart.data.datasets[0].data.push(incoming);
        trafficChart.data.datasets[1].data.push(outgoing);

        if (trafficChart.data.labels.length > 20) {
            trafficChart.data.labels.shift();
            trafficChart.data.datasets[0].data.shift();
            trafficChart.data.datasets[1].data.shift();
        }

        trafficChart.update();
    }

    // --- Animations ---

    function createPacketAnimation(type) {
        const packet = document.createElement('div');
        packet.className = 'packet';
        
        let container;
        let animationName;
        let duration = 0.8 + Math.random() * 0.4;

        if (type === 'incoming') {
            container = incomingContainer;
            animationName = 'fall';
            // Random horizontal offset for stream effect
            packet.style.left = `${Math.random() * 40 - 20}px`;
            packet.style.top = '-100px';
        } else if (type === 'outgoing') {
            container = outgoingContainer;
            animationName = 'leak';
            packet.style.left = `${Math.random() * 40 - 20}px`;
            packet.style.top = '250px';
            packet.style.background = 'var(--secondary-gradient)';
        } else if (type === 'dropped') {
            container = droppedContainer;
            animationName = 'drop';
            packet.style.right = '0';
            packet.style.top = '20px';
            packet.style.background = 'var(--danger-gradient)';
        }

        packet.style.animation = `${animationName} ${duration}s ease-out forwards`;
        container.appendChild(packet);

        // Remove element after animation
        setTimeout(() => {
            packet.remove();
        }, duration * 1000);
    }

    // Initialize display
    updateMetrics();
    updateBucketUI();
});
