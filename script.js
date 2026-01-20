// N-Back Test Application
class NBackTest {
    constructor() {
        this.nValue = 2;
        this.numTrials = 30;
        this.stimulusType = 'letters';
        this.stimulusDuration = 2000;
        this.currentTrial = 0;
        this.sequence = [];
        this.responses = [];
        this.reactionTimes = [];
        this.testStartTime = null;
        this.stimulusStartTime = null;
        this.isTestRunning = false;
        this.timeoutId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardListeners();
    }

    setupEventListeners() {
        // Mobile menu
        const menuToggle = document.querySelector('.menu-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
            });
        }

        // Close menu when clicking on a link
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });

        // Test configuration form
        const configForm = document.querySelector('.config-form');
        if (configForm) {
            configForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startTest();
            });
        }

        // Response buttons
        const matchBtn = document.getElementById('match-btn');
        const noMatchBtn = document.getElementById('no-match-btn');
        const endTestBtn = document.getElementById('end-test-btn');
        const retryBtn = document.getElementById('retry-btn');
        const newTestBtn = document.getElementById('new-test-btn');

        if (matchBtn) {
            matchBtn.addEventListener('click', () => this.handleResponse(true));
        }

        if (noMatchBtn) {
            noMatchBtn.addEventListener('click', () => this.handleResponse(false));
        }

        if (endTestBtn) {
            endTestBtn.addEventListener('click', () => this.endTest());
        }

        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.retryTest());
        }

        if (newTestBtn) {
            newTestBtn.addEventListener('click', () => this.newTest());
        }

        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const offsetTop = target.offsetTop - 70;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    setupKeyboardListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.isTestRunning) return;

            if (e.code === 'Space') {
                e.preventDefault();
                this.handleResponse(true);
            }
        });
    }

    generateSequence() {
        const sequence = [];
        const targets = [];
        
        if (this.stimulusType === 'letters') {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            for (let i = 0; i < this.numTrials; i++) {
                let stimulus;
                let isTarget = false;

                // Determine if this should be a target (n-back match)
                if (i >= this.nValue) {
                    const shouldBeTarget = Math.random() < 0.3; // 30% chance of target
                    if (shouldBeTarget) {
                        stimulus = sequence[i - this.nValue];
                        isTarget = true;
                        targets.push(i);
                    } else {
                        // Ensure it's not a match
                        let candidate;
                        do {
                            candidate = letters[Math.floor(Math.random() * letters.length)];
                        } while (candidate === sequence[i - this.nValue]);
                        stimulus = candidate;
                    }
                } else {
                    stimulus = letters[Math.floor(Math.random() * letters.length)];
                }

                sequence.push(stimulus);
            }
        } else if (this.stimulusType === 'numbers') {
            const numbers = '0123456789';
            for (let i = 0; i < this.numTrials; i++) {
                let stimulus;
                let isTarget = false;

                if (i >= this.nValue) {
                    const shouldBeTarget = Math.random() < 0.3;
                    if (shouldBeTarget) {
                        stimulus = sequence[i - this.nValue];
                        isTarget = true;
                        targets.push(i);
                    } else {
                        let candidate;
                        do {
                            candidate = numbers[Math.floor(Math.random() * numbers.length)];
                        } while (candidate === sequence[i - this.nValue]);
                        stimulus = candidate;
                    }
                } else {
                    stimulus = numbers[Math.floor(Math.random() * numbers.length)];
                }

                sequence.push(stimulus);
            }
        } else if (this.stimulusType === 'positions') {
            const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            for (let i = 0; i < this.numTrials; i++) {
                let position;
                let isTarget = false;

                if (i >= this.nValue) {
                    const shouldBeTarget = Math.random() < 0.3;
                    if (shouldBeTarget) {
                        position = sequence[i - this.nValue];
                        isTarget = true;
                        targets.push(i);
                    } else {
                        let candidate;
                        do {
                            candidate = positions[Math.floor(Math.random() * positions.length)];
                        } while (candidate === sequence[i - this.nValue]);
                        position = candidate;
                    }
                } else {
                    position = positions[Math.floor(Math.random() * positions.length)];
                }

                sequence.push(position);
            }
        }

        return { sequence, targets };
    }

    startTest() {
        // Get configuration
        this.nValue = parseInt(document.getElementById('nValue').value);
        this.numTrials = parseInt(document.getElementById('numTrials').value);
        this.stimulusType = document.getElementById('stimulusType').value;
        this.stimulusDuration = parseInt(document.getElementById('stimulusDuration').value);

        // Generate sequence
        const { sequence, targets } = this.generateSequence();
        this.sequence = sequence;
        this.targets = new Set(targets);
        this.responses = [];
        this.reactionTimes = [];
        this.currentTrial = 0;
        this.isTestRunning = true;

        // Show test interface
        document.getElementById('test-config').classList.add('hidden');
        document.getElementById('test-interface').classList.remove('hidden');
        document.getElementById('test-results').classList.add('hidden');

        // Update display
        document.getElementById('n-value-display').textContent = `N-Back: ${this.nValue}`;
        document.getElementById('trial-counter').textContent = `Trial 0 / ${this.numTrials}`;

        // Start first trial
        this.testStartTime = Date.now();
        this.showStimulus();
    }

    showStimulus() {
        if (this.currentTrial >= this.numTrials) {
            this.endTest();
            return;
        }

        const stimulus = this.sequence[this.currentTrial];
        const stimulusDisplay = document.getElementById('stimulus-display');
        const gridDisplay = document.getElementById('grid-display');
        const feedback = document.getElementById('feedback');

        // Clear feedback
        feedback.textContent = '';
        feedback.className = 'feedback';

        // Update trial counter
        document.getElementById('trial-counter').textContent = 
            `Trial ${this.currentTrial + 1} / ${this.numTrials}`;

        // Display stimulus based on type
        if (this.stimulusType === 'positions') {
            stimulusDisplay.classList.add('hidden');
            gridDisplay.classList.remove('hidden');
            
            // Clear grid
            gridDisplay.innerHTML = '';
            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                if (i === stimulus) {
                    cell.classList.add('active');
                }
                gridDisplay.appendChild(cell);
            }
        } else {
            gridDisplay.classList.add('hidden');
            stimulusDisplay.classList.remove('hidden');
            stimulusDisplay.textContent = stimulus;
            stimulusDisplay.classList.add('show');
            setTimeout(() => {
                stimulusDisplay.classList.remove('show');
            }, 300);
        }

        this.stimulusStartTime = Date.now();

        // Auto-advance after duration
        this.timeoutId = setTimeout(() => {
            if (this.isTestRunning && this.currentTrial < this.numTrials) {
                // No response was given
                this.handleResponse(false, true);
            }
        }, this.stimulusDuration);
    }

    handleResponse(userResponded, autoAdvance = false) {
        if (!this.isTestRunning || this.currentTrial >= this.numTrials) return;

        clearTimeout(this.timeoutId);

        const isTarget = this.targets.has(this.currentTrial);
        const reactionTime = autoAdvance ? null : Date.now() - this.stimulusStartTime;

        // Record response
        this.responses.push({
            trial: this.currentTrial,
            isTarget: isTarget,
            userResponded: userResponded,
            reactionTime: reactionTime
        });

        if (reactionTime !== null) {
            this.reactionTimes.push(reactionTime);
        }

        // Show feedback
        const feedback = document.getElementById('feedback');
        let feedbackText = '';
        let feedbackClass = '';

        if (isTarget && userResponded) {
            feedbackText = '✓ Correct!';
            feedbackClass = 'correct';
        } else if (!isTarget && !userResponded) {
            feedbackText = '✓ Correct';
            feedbackClass = 'correct';
        } else if (isTarget && !userResponded) {
            feedbackText = '✗ Miss';
            feedbackClass = 'incorrect';
        } else if (!isTarget && userResponded) {
            feedbackText = '✗ False Alarm';
            feedbackClass = 'incorrect';
        }

        feedback.textContent = feedbackText;
        feedback.className = `feedback ${feedbackClass}`;

        // Move to next trial
        this.currentTrial++;
        
        setTimeout(() => {
            if (this.isTestRunning) {
                this.showStimulus();
            }
        }, 500);
    }

    endTest() {
        this.isTestRunning = false;
        clearTimeout(this.timeoutId);

        // Calculate results
        const results = this.calculateResults();

        // Show results
        document.getElementById('test-interface').classList.add('hidden');
        document.getElementById('test-results').classList.remove('hidden');

        // Display results
        document.getElementById('accuracy').textContent = `${results.accuracy}%`;
        document.getElementById('hits').textContent = results.hits;
        document.getElementById('misses').textContent = results.misses;
        document.getElementById('false-alarms').textContent = results.falseAlarms;
        document.getElementById('correct-rejections').textContent = results.correctRejections;
        document.getElementById('reaction-time').textContent = 
            results.avgReactionTime > 0 ? `${Math.round(results.avgReactionTime)} ms` : 'N/A';
    }

    calculateResults() {
        let hits = 0;
        let misses = 0;
        let falseAlarms = 0;
        let correctRejections = 0;
        let totalReactionTime = 0;
        let reactionTimeCount = 0;

        this.responses.forEach(response => {
            if (response.isTarget && response.userResponded) {
                hits++;
                if (response.reactionTime !== null) {
                    totalReactionTime += response.reactionTime;
                    reactionTimeCount++;
                }
            } else if (response.isTarget && !response.userResponded) {
                misses++;
            } else if (!response.isTarget && response.userResponded) {
                falseAlarms++;
            } else if (!response.isTarget && !response.userResponded) {
                correctRejections++;
            }
        });

        const totalTargets = hits + misses;
        const totalNonTargets = falseAlarms + correctRejections;
        const accuracy = totalTargets > 0 
            ? Math.round((hits / totalTargets) * 100) 
            : 0;
        const avgReactionTime = reactionTimeCount > 0 
            ? totalReactionTime / reactionTimeCount 
            : 0;

        return {
            hits,
            misses,
            falseAlarms,
            correctRejections,
            accuracy,
            avgReactionTime
        };
    }

    retryTest() {
        this.startTest();
    }

    newTest() {
        document.getElementById('test-results').classList.add('hidden');
        document.getElementById('test-config').classList.remove('hidden');
    }
}

function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
    }
}

// Initialize the test and theme when page loads
document.addEventListener('DOMContentLoaded', () => {
    new NBackTest();

    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
            localStorage.setItem('theme', nextTheme);
            applyTheme(nextTheme);
        });
    }
});

// Navbar scroll effect
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
    } else {
        navbar.style.boxShadow = '0 1px 2px 0 rgb(0 0 0 / 0.05)';
    }
    
    lastScroll = currentScroll;
});
