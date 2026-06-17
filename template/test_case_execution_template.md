## Test Execution Report Generation

Using the provided [Test Specification document], execute or validate each test case against the implemented system and generate a **Test Execution Report**.

### Report Rules

1. For every test case, generate an execution result.
2. Do NOT repeat the full test specification.
3. Summarize execution in a tabular format.
4. Each test case must contain:

   * Test ID
   * Test Name
   * Expected Result
   * Actual Result
   * Status (PASS / FAIL)
5. Status must be determined based on whether the actual result matches the expected result.
6. Keep Expected Result and Actual Result concise (1-2 lines maximum).
7. Include a summary section at the end.

### Output Format

# Test Execution Report

| Test ID | Test Name | Expected Result   | Actual Result            | Status    |
| ------- | --------- | ----------------- | ------------------------ | --------- |
| TS-XXX  | Test Name | Expected behavior | Actual behavior observed | PASS/FAIL |

## Summary

| Metric           | Value |
| ---------------- | ----- |
| Total Test Cases | X     |
| Passed           | X     |
| Failed           | X     |
| Pass Percentage  | XX%   |

## Failed Test Details

For each failed test provide:

* Test ID
* Failure Reason
* Expected Result
* Actual Result
* Recommendation


### Important Rules

* Output only execution results, not the entire test specification.
* Use PASS or FAIL only.
* Do not use "Success", "Completed", "Partially Passed", or other status values.
* If all tests pass, state: "No failed test cases observed during execution."
* Keep the report concise and suitable for QA sign-off.
