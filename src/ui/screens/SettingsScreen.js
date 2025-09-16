/**
 * SettingsScreen - Comprehensive settings menu with tabbed interface
 * Allows configuration of gameplay, controls, audio, video, and account settings
 */

import { Screen } from '../Screen.js';

export class SettingsScreen extends Screen {
    constructor(screenManager, game) {
        super(screenManager, game);
        this.id = 'settings-screen';
        this.activeTab = 'gameplay';
        this.settings = {};
        this.unsavedChanges = false;
        this.tabElements = {};
        this.settingElements = {};
    }

    createElement() {
        super.createElement();

        this.element.innerHTML = `
            <div class="settings-screen" role="main" aria-labelledby="settings-title">
                <header class="settings-header">
                    <h1 id="settings-title" class="settings-title">SETTINGS</h1>
                    <div class="settings-subtitle">Configure your game experience</div>
                </header>

                <nav class="settings-tabs" role="tablist" aria-label="Settings categories">
                    <button class="tab-button active" role="tab" data-tab="gameplay" aria-selected="true" aria-controls="gameplay-panel">
                        <span class="tab-icon">🎮</span>
                        <span class="tab-text">GAMEPLAY</span>
                    </button>
                    <button class="tab-button" role="tab" data-tab="controls" aria-selected="false" aria-controls="controls-panel">
                        <span class="tab-icon">⌨️</span>
                        <span class="tab-text">CONTROLS</span>
                    </button>
                    <button class="tab-button" role="tab" data-tab="audio" aria-selected="false" aria-controls="audio-panel">
                        <span class="tab-icon">🔊</span>
                        <span class="tab-text">AUDIO</span>
                    </button>
                    <button class="tab-button" role="tab" data-tab="video" aria-selected="false" aria-controls="video-panel">
                        <span class="tab-icon">🖥️</span>
                        <span class="tab-text">VIDEO</span>
                    </button>
                    <button class="tab-button" role="tab" data-tab="accessibility" aria-selected="false" aria-controls="accessibility-panel">
                        <span class="tab-icon">♿</span>
                        <span class="tab-text">ACCESS</span>
                    </button>
                </nav>

                <main class="settings-content">
                    <!-- Gameplay Settings -->
                    <div id="gameplay-panel" class="tab-panel active" role="tabpanel" aria-labelledby="gameplay-tab">
                        <h2 class="panel-title">Gameplay Settings</h2>

                        <div class="settings-group">
                            <h3 class="group-title">Piece Behavior</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="ghost-piece">Ghost Piece</label>
                                <div class="setting-control">
                                    <toggle-switch id="ghost-piece" data-setting="ghostPiece"></toggle-switch>
                                </div>
                                <div class="setting-description">Show preview of where the piece will land</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="hold-enabled">Hold Piece</label>
                                <div class="setting-control">
                                    <toggle-switch id="hold-enabled" data-setting="holdEnabled"></toggle-switch>
                                </div>
                                <div class="setting-description">Allow holding pieces for later use</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="lock-delay">Lock Delay</label>
                                <div class="setting-control">
                                    <range-slider id="lock-delay" data-setting="lockDelay" min="0" max="1000" step="50" value="500"></range-slider>
                                    <span class="setting-value" id="lock-delay-value">500ms</span>
                                </div>
                                <div class="setting-description">Time before a piece locks in place</div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <h3 class="group-title">Input Timing</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="das">DAS (Delayed Auto Shift)</label>
                                <div class="setting-control">
                                    <range-slider id="das" data-setting="das" min="50" max="300" step="10" value="167"></range-slider>
                                    <span class="setting-value" id="das-value">167ms</span>
                                </div>
                                <div class="setting-description">Delay before auto-repeat starts</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="arr">ARR (Auto Repeat Rate)</label>
                                <div class="setting-control">
                                    <range-slider id="arr" data-setting="arr" min="16" max="100" step="1" value="33"></range-slider>
                                    <span class="setting-value" id="arr-value">33ms</span>
                                </div>
                                <div class="setting-description">Speed of repeated movement</div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <h3 class="group-title">Difficulty</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="starting-level">Starting Level</label>
                                <div class="setting-control">
                                    <range-slider id="starting-level" data-setting="startingLevel" min="1" max="20" step="1" value="1"></range-slider>
                                    <span class="setting-value" id="starting-level-value">1</span>
                                </div>
                                <div class="setting-description">Initial difficulty level</div>
                            </div>
                        </div>
                    </div>

                    <!-- Controls Settings -->
                    <div id="controls-panel" class="tab-panel" role="tabpanel" aria-labelledby="controls-tab">
                        <h2 class="panel-title">Control Settings</h2>

                        <div class="settings-group">
                            <h3 class="group-title">Key Bindings</h3>
                            <div class="controls-grid" id="key-bindings">
                                <!-- Key bindings will be dynamically generated -->
                            </div>
                            <button class="btn btn-secondary" id="reset-controls">Reset to Defaults</button>
                        </div>

                        <div class="settings-group">
                            <h3 class="group-title">Touch Controls</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="touch-enabled">Touch Controls</label>
                                <div class="setting-control">
                                    <toggle-switch id="touch-enabled" data-setting="touchEnabled"></toggle-switch>
                                </div>
                                <div class="setting-description">Show virtual buttons on touch devices</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="haptic-feedback">Haptic Feedback</label>
                                <div class="setting-control">
                                    <toggle-switch id="haptic-feedback" data-setting="hapticFeedback"></toggle-switch>
                                </div>
                                <div class="setting-description">Vibration feedback on mobile devices</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="touch-sensitivity">Touch Sensitivity</label>
                                <div class="setting-control">
                                    <range-slider id="touch-sensitivity" data-setting="touchSensitivity" min="0.5" max="2" step="0.1" value="1"></range-slider>
                                    <span class="setting-value" id="touch-sensitivity-value">1.0</span>
                                </div>
                                <div class="setting-description">Sensitivity of touch gestures</div>
                            </div>
                        </div>
                    </div>

                    <!-- Audio Settings -->
                    <div id="audio-panel" class="tab-panel" role="tabpanel" aria-labelledby="audio-tab">
                        <h2 class="panel-title">Audio Settings</h2>

                        <div class="settings-group">
                            <h3 class="group-title">Volume</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="master-volume">Master Volume</label>
                                <div class="setting-control">
                                    <range-slider id="master-volume" data-setting="masterVolume" min="0" max="100" step="5" value="80"></range-slider>
                                    <span class="setting-value" id="master-volume-value">80%</span>
                                </div>
                                <div class="setting-description">Overall audio volume</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="music-volume">Music Volume</label>
                                <div class="setting-control">
                                    <range-slider id="music-volume" data-setting="musicVolume" min="0" max="100" step="5" value="70"></range-slider>
                                    <span class="setting-value" id="music-volume-value">70%</span>
                                </div>
                                <div class="setting-description">Background music volume</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="sfx-volume">Sound Effects</label>
                                <div class="setting-control">
                                    <range-slider id="sfx-volume" data-setting="sfxVolume" min="0" max="100" step="5" value="90"></range-slider>
                                    <span class="setting-value" id="sfx-volume-value">90%</span>
                                </div>
                                <div class="setting-description">Game sound effects volume</div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <h3 class="group-title">Audio Options</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="dynamic-music">Dynamic Music</label>
                                <div class="setting-control">
                                    <toggle-switch id="dynamic-music" data-setting="dynamicMusic"></toggle-switch>
                                </div>
                                <div class="setting-description">Music changes with game intensity</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="spatial-audio">Spatial Audio</label>
                                <div class="setting-control">
                                    <toggle-switch id="spatial-audio" data-setting="spatialAudio"></toggle-switch>
                                </div>
                                <div class="setting-description">3D positioned audio effects</div>
                            </div>
                        </div>
                    </div>

                    <!-- Video Settings -->
                    <div id="video-panel" class="tab-panel" role="tabpanel" aria-labelledby="video-tab">
                        <h2 class="panel-title">Video Settings</h2>

                        <div class="settings-group">
                            <h3 class="group-title">Display</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="theme">Color Theme</label>
                                <div class="setting-control">
                                    <select-dropdown id="theme" data-setting="theme">
                                        <option value="neon-cyan">Neon Cyan</option>
                                        <option value="cyberpunk">Cyberpunk</option>
                                        <option value="synthwave">Synthwave</option>
                                        <option value="matrix">Matrix</option>
                                        <option value="custom">Custom</option>
                                    </select-dropdown>
                                </div>
                                <div class="setting-description">Visual color scheme</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="particle-effects">Particle Effects</label>
                                <div class="setting-control">
                                    <toggle-switch id="particle-effects" data-setting="particleEffects"></toggle-switch>
                                </div>
                                <div class="setting-description">Enable particle animations</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="screen-shake">Screen Shake</label>
                                <div class="setting-control">
                                    <range-slider id="screen-shake" data-setting="screenShake" min="0" max="100" step="10" value="50"></range-slider>
                                    <span class="setting-value" id="screen-shake-value">50%</span>
                                </div>
                                <div class="setting-description">Intensity of screen shake effects</div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <h3 class="group-title">Performance</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="target-fps">Target FPS</label>
                                <div class="setting-control">
                                    <select-dropdown id="target-fps" data-setting="targetFPS">
                                        <option value="30">30 FPS</option>
                                        <option value="60" selected>60 FPS</option>
                                        <option value="120">120 FPS</option>
                                        <option value="144">144 FPS</option>
                                    </select-dropdown>
                                </div>
                                <div class="setting-description">Target frame rate</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="show-fps">Show FPS Counter</label>
                                <div class="setting-control">
                                    <toggle-switch id="show-fps" data-setting="showFPS"></toggle-switch>
                                </div>
                                <div class="setting-description">Display frame rate counter</div>
                            </div>
                        </div>
                    </div>

                    <!-- Accessibility Settings -->
                    <div id="accessibility-panel" class="tab-panel" role="tabpanel" aria-labelledby="accessibility-tab">
                        <h2 class="panel-title">Accessibility Settings</h2>

                        <div class="settings-group">
                            <h3 class="group-title">Visual Accessibility</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="high-contrast">High Contrast Mode</label>
                                <div class="setting-control">
                                    <toggle-switch id="high-contrast" data-setting="highContrast"></toggle-switch>
                                </div>
                                <div class="setting-description">Enhanced contrast for better visibility</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="colorblind-friendly">Colorblind Support</label>
                                <div class="setting-control">
                                    <toggle-switch id="colorblind-friendly" data-setting="colorblindFriendly"></toggle-switch>
                                </div>
                                <div class="setting-description">Use patterns and shapes in addition to colors</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="font-size">UI Font Size</label>
                                <div class="setting-control">
                                    <range-slider id="font-size" data-setting="fontSize" min="80" max="150" step="10" value="100"></range-slider>
                                    <span class="setting-value" id="font-size-value">100%</span>
                                </div>
                                <div class="setting-description">Size of interface text</div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <h3 class="group-title">Motor Accessibility</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="one-handed-mode">One-Handed Mode</label>
                                <div class="setting-control">
                                    <toggle-switch id="one-handed-mode" data-setting="oneHandedMode"></toggle-switch>
                                </div>
                                <div class="setting-description">Optimize controls for single-hand use</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="hold-to-toggle">Hold to Toggle</label>
                                <div class="setting-control">
                                    <toggle-switch id="hold-to-toggle" data-setting="holdToToggle"></toggle-switch>
                                </div>
                                <div class="setting-description">Convert hold actions to toggle actions</div>
                            </div>
                        </div>

                        <div class="settings-group">
                            <h3 class="group-title">Cognitive Accessibility</h3>

                            <div class="setting-item">
                                <label class="setting-label" for="simplified-ui">Simplified UI</label>
                                <div class="setting-control">
                                    <toggle-switch id="simplified-ui" data-setting="simplifiedUI"></toggle-switch>
                                </div>
                                <div class="setting-description">Reduce interface complexity</div>
                            </div>

                            <div class="setting-item">
                                <label class="setting-label" for="reduce-motion">Reduce Motion</label>
                                <div class="setting-control">
                                    <toggle-switch id="reduce-motion" data-setting="reduceMotion"></toggle-switch>
                                </div>
                                <div class="setting-description">Minimize animations and transitions</div>
                            </div>
                        </div>
                    </div>
                </main>

                <footer class="settings-footer">
                    <div class="settings-actions">
                        <button class="btn btn-secondary" id="reset-all-btn">Reset All</button>
                        <button class="btn btn-secondary" id="cancel-btn">Cancel</button>
                        <button class="btn btn-primary" id="save-btn">Save Changes</button>
                    </div>

                    <div class="unsaved-indicator" id="unsaved-indicator" style="display: none;">
                        <span class="indicator-icon">●</span>
                        <span class="indicator-text">Unsaved changes</span>
                    </div>
                </footer>
            </div>
        `;

        this.setupStyles();
        this.cacheElements();
        this.loadSettings();
        this.generateKeyBindingsUI();
        this.setupCustomComponents();
    }

    setupStyles() {
        // I'll add the CSS styles for the settings screen
        const style = document.createElement('style');
        style.textContent = `
            .settings-screen {
                position: relative;
                width: 100%;
                height: 100vh;
                background: linear-gradient(135deg, #0A0A0F 0%, #1A1A2E 100%);
                color: #00FFFF;
                font-family: var(--font-primary);
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .settings-header {
                text-align: center;
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
            }

            .settings-title {
                font-family: var(--font-primary);
                font-size: 2.5rem;
                font-weight: 900;
                color: #00FFFF;
                margin: 0;
                text-shadow: 0 0 20px #00FFFF;
                animation: titleGlow 3s ease-in-out infinite alternate;
            }

            .settings-subtitle {
                font-family: var(--font-mono);
                font-size: 0.9rem;
                color: #888;
                margin-top: 0.5rem;
                letter-spacing: 0.1em;
            }

            .settings-tabs {
                display: flex;
                background: rgba(0, 255, 255, 0.05);
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
                overflow-x: auto;
            }

            .tab-button {
                background: transparent;
                border: none;
                color: #888;
                font-family: var(--font-primary);
                font-weight: 600;
                padding: 1rem 1.5rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                min-width: 120px;
                border-bottom: 3px solid transparent;
            }

            .tab-button:hover,
            .tab-button:focus {
                color: #00FFFF;
                background: rgba(0, 255, 255, 0.1);
                outline: none;
            }

            .tab-button.active {
                color: #00FFFF;
                background: rgba(0, 255, 255, 0.15);
                border-bottom-color: #00FFFF;
                text-shadow: 0 0 10px #00FFFF;
            }

            .tab-icon {
                font-size: 1.2em;
            }

            .settings-content {
                flex: 1;
                overflow-y: auto;
                padding: 2rem;
            }

            .tab-panel {
                display: none;
                max-width: 800px;
                margin: 0 auto;
            }

            .tab-panel.active {
                display: block;
                animation: panelFadeIn 0.3s ease;
            }

            @keyframes panelFadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .panel-title {
                font-size: 1.8rem;
                font-weight: 800;
                color: #00FFFF;
                margin: 0 0 2rem 0;
                text-shadow: 0 0 10px #00FFFF;
            }

            .settings-group {
                background: rgba(0, 255, 255, 0.05);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }

            .group-title {
                font-size: 1.2rem;
                font-weight: 700;
                color: #00FFFF;
                margin: 0 0 1.5rem 0;
                padding-bottom: 0.5rem;
                border-bottom: 1px solid rgba(0, 255, 255, 0.3);
            }

            .setting-item {
                display: grid;
                grid-template-columns: 1fr 200px;
                gap: 1rem;
                align-items: center;
                padding: 1rem 0;
                border-bottom: 1px solid rgba(0, 255, 255, 0.1);
            }

            .setting-item:last-child {
                border-bottom: none;
            }

            .setting-label {
                font-weight: 600;
                color: #00FFFF;
                font-size: 1rem;
            }

            .setting-control {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                justify-content: flex-end;
            }

            .setting-description {
                grid-column: 1 / -1;
                font-size: 0.8rem;
                color: #888;
                margin-top: 0.25rem;
            }

            .setting-value {
                font-family: var(--font-mono);
                font-size: 0.9rem;
                color: #00FFFF;
                min-width: 50px;
                text-align: right;
            }

            /* Custom Components */
            toggle-switch {
                display: inline-block;
                width: 60px;
                height: 30px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 15px;
                position: relative;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            toggle-switch.active {
                background: rgba(0, 255, 255, 0.3);
                border-color: #00FFFF;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
            }

            toggle-switch::before {
                content: '';
                position: absolute;
                top: 2px;
                left: 2px;
                width: 24px;
                height: 24px;
                background: #00FFFF;
                border-radius: 50%;
                transition: all 0.3s ease;
                box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
            }

            toggle-switch.active::before {
                left: 32px;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.8);
            }

            range-slider {
                display: inline-block;
                width: 120px;
                height: 30px;
                position: relative;
            }

            range-slider input[type="range"] {
                width: 100%;
                height: 8px;
                background: rgba(0, 255, 255, 0.2);
                border-radius: 4px;
                outline: none;
                -webkit-appearance: none;
                appearance: none;
            }

            range-slider input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: #00FFFF;
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }

            range-slider input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: #00FFFF;
                border-radius: 50%;
                cursor: pointer;
                border: none;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }

            select-dropdown {
                display: inline-block;
                position: relative;
            }

            select-dropdown select {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 255, 255, 0.3);
                border-radius: 4px;
                color: #00FFFF;
                font-family: var(--font-primary);
                padding: 0.5rem 2rem 0.5rem 0.8rem;
                cursor: pointer;
                outline: none;
                min-width: 120px;
            }

            select-dropdown select:focus {
                border-color: #00FFFF;
                box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
            }

            .controls-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
                margin-bottom: 1rem;
            }

            .key-binding-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(0, 255, 255, 0.2);
                border-radius: 4px;
            }

            .key-binding-label {
                font-size: 0.9rem;
                color: #00FFFF;
            }

            .key-binding-keys {
                display: flex;
                gap: 0.25rem;
            }

            .key-badge {
                background: rgba(0, 255, 255, 0.2);
                border: 1px solid #00FFFF;
                border-radius: 3px;
                padding: 0.2rem 0.4rem;
                font-family: var(--font-mono);
                font-size: 0.8rem;
                color: #00FFFF;
            }

            .settings-footer {
                padding: 1.5rem 2rem;
                border-top: 1px solid rgba(0, 255, 255, 0.2);
                background: rgba(0, 255, 255, 0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .settings-actions {
                display: flex;
                gap: 1rem;
            }

            .btn {
                background: transparent;
                border: 2px solid #00FFFF;
                color: #00FFFF;
                font-family: var(--font-primary);
                font-weight: 700;
                padding: 0.8rem 1.5rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .btn-primary {
                background: rgba(0, 255, 255, 0.1);
            }

            .btn:hover,
            .btn:focus {
                background: rgba(0, 255, 255, 0.2);
                box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
                outline: none;
            }

            .unsaved-indicator {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #FFD700;
                font-size: 0.9rem;
            }

            .indicator-icon {
                animation: blink 1s infinite;
            }

            @keyframes blink {
                0%, 50% { opacity: 1; }
                51%, 100% { opacity: 0.3; }
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .settings-content {
                    padding: 1rem;
                }

                .setting-item {
                    grid-template-columns: 1fr;
                    gap: 0.5rem;
                }

                .setting-control {
                    justify-content: flex-start;
                }

                .controls-grid {
                    grid-template-columns: 1fr;
                }

                .settings-actions {
                    flex-direction: column;
                    width: 100%;
                }

                .settings-footer {
                    flex-direction: column;
                    gap: 1rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Continue with the rest of the SettingsScreen implementation...
    // (This would include the cacheElements, setupEventListeners, loadSettings, etc. methods)
}