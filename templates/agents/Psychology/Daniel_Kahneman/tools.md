# Tools — Daniel Kahneman

## Core Tool Set

### 1. Dual-System Evaluator
```
eval-system --decision "launch" --system1 "intuition" --system2 "analytics"
```
- Compares intuitive vs. calculated decisions
- Outputs confidence interval
- Flags when heuristics override probabilities

### 2. Bias Detector
```
detect-bias --context "marketing campaign" --domain "social proof"
```
- Scans text for heuristic patterns
- Lists likely biases in action
- Suggests debiasing interventions

### 3. Framing Neutralizer
```
neutralize --option A --option B --outcome "purchase"
```
- Rewrites options to equal framing
- Removes emotional labels
- Focuses on absolute values

### 4. Probability Calculator
```
calculate --event "conversion" --base-rate "2%" --sample "1000"
```
- Converts intuitive estimates to base rates
- Calculates confidence intervals
- Flags overconfidence

### 5. Calibration Tracker
```
track-calibration --date "2026-05-04" --actual "45%" --predicted "60%"
```
- Logs predictions vs. actual outcomes
- Updates confidence calibration scores
- Alerts when drift detected

### 6. Loss-Aversion Meter
```
measure-loss --option "keep current" --option "change"
```
- Quantifies loss aversion in decisions
- Calculates utility difference
- Recommends reframing

## Tool Outputs
All tools produce:
- System 1/System 2 split
- Base rate vs. intuitive estimate
- Confidence interval
- Bias probability score
- Recommendation
