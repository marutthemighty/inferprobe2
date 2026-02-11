#!/usr/bin/env node

// inferprobe-cli/src/cli.ts
// Main CLI entry point

import { Command } from 'commander';
import chalk from 'chalk';
import { scanEndpoint, runAdversarialTests, analyzeCosts, compareResults } from './commands';

const program = new Command();

program
  .name('inferprobe')
  .description('CLI tool for AI model testing and safety analysis')
  .version('1.0.0');

// Endpoint management
program
  .command('endpoint <action>')
  .description('Manage AI endpoints')
  .option('--name <name>', 'Endpoint name')
  .option('--url <url>', 'Endpoint URL')
  .option('--type <type>', 'Endpoint type (llm, vision, etc.)')
  .option('--output <format>', 'Output format (json, table)', 'table')
  .action(async (action, options) => {
    console.log(chalk.blue('Managing endpoint...'));
    // Implementation would call InferProbe API
  });

// Run scans
program
  .command('scan <type>')
  .description('Run a scan (single, batch, adversarial)')
  .option('--endpoint-id <id>', 'Endpoint ID')
  .option('--input <input>', 'Input text or file path')
  .option('--dataset <file>', 'Dataset file for batch scan')
  .option('--output <file>', 'Output file path', 'results.json')
  .action(async (type, options) => {
    console.log(chalk.blue(`Running ${type} scan...`));
    await scanEndpoint(type, options);
  });

// Adversarial testing
program
  .command('test adversarial')
  .description('Run adversarial safety tests')
  .option('--endpoint-id <id>', 'Endpoint ID', process.env.ENDPOINT_ID)
  .option('--severity <levels>', 'Severity levels (critical,high,medium,low)', 'critical,high')
  .option('--category <categories>', 'Attack categories')
  .option('--output <file>', 'Output file', 'adversarial-results.json')
  .option('--fail-on-critical', 'Exit with error if critical vulnerabilities found')
  .action(async (options) => {
    console.log(chalk.blue('Running adversarial tests...'));
    await runAdversarialTests(options);
  });

// Cost analysis
program
  .command('cost <action>')
  .description('Analyze and optimize costs')
  .option('--results-dir <dir>', 'Directory containing test results')
  .option('--model <model>', 'Current model name')
  .option('--output <file>', 'Output file')
  .action(async (action, options) => {
    console.log(chalk.blue('Analyzing costs...'));
    await analyzeCosts(action, options);
  });

// Compare results
program
  .command('compare')
  .description('Compare two test results for drift detection')
  .option('--baseline <file>', 'Baseline results file')
  .option('--current <file>', 'Current results file')
  .option('--max-drift <threshold>', 'Maximum allowed drift', '0.15')
  .option('--fail-on-regression', 'Exit with error if regression detected')
  .action(async (options) => {
    console.log(chalk.blue('Comparing results...'));
    await compareResults(options);
  });

// Generate reports
program
  .command('report generate')
  .description('Generate comprehensive test report')
  .option('--adversarial <file>', 'Adversarial test results')
  .option('--performance <file>', 'Performance test results')
  .option('--cost <file>', 'Cost analysis results')
  .option('--format <format>', 'Report format (markdown, html, pdf)', 'markdown')
  .option('--output <file>', 'Output file', 'report.md')
  .action(async (options) => {
    console.log(chalk.blue('Generating report...'));
    // Generate comprehensive report
  });

program.parse(process.argv);
