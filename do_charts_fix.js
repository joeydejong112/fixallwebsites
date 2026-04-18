import fs from 'fs';
const content = fs.readFileSync('app/pages/dashboard/index.vue', 'utf-8');

// Find VIEW: CHARTS
const viewCharsIdx = content.indexOf('VIEW: CHARTS');
if (viewCharsIdx === -1) {
    console.error('VIEW: CHARTS not found');
    process.exit(1);
}

// Find the opening <template v-else-if="currentView === 'charts'">
const openTemplateSearch = content.indexOf('<template v-else-if="currentView === \'charts\'">', viewCharsIdx);
if (openTemplateSearch === -1) {
    console.error('charts template tag not found');
    process.exit(1);
}

// Search forward from after the opening tag to find the correct closing </template>
// We need to track nesting depth - depth starts at 1 (we're inside the charts template)
// and decrements when we hit the matching </template>
let searchFrom = openTemplateSearch + '<template v-else-if="currentView === \'charts\'">'.length;
let depth = 1;
let closeIdx = -1;

while (searchFrom < content.length) {
    // Look for </template> first (closing tag reduces depth)
    const closeTagIdx = content.indexOf('</template>', searchFrom);
    // Look for <template (but not </template>)
    const openTagIdx = content.indexOf('<template', searchFrom);

    if (closeTagIdx === -1) {
        // No more closing tags
        break;
    }

    // Check if there's an opening <template> before the closing tag
    if (openTagIdx !== -1 && openTagIdx < closeTagIdx) {
        // There's a nested <template> before the next </template>
        depth++;
        searchFrom = openTagIdx + '<template'.length;
    } else {
        // The next </template> reduces depth
        depth--;
        if (depth === 0) {
            closeIdx = closeTagIdx;
            break;
        }
        searchFrom = closeTagIdx + '</template>'.length;
    }
}

if (closeIdx === -1) {
    console.error('Could not find outer closing </template>');
    process.exit(1);
}

console.log('Found outer closing </template> at index', closeIdx);

// The end of the block we want to replace
const blockEndIdx = closeIdx + '</template>'.length;

// Find the start of the block - the blank line before VIEW: CHARTS comment
// Look backward from VIEW: CHARTS to find the blank line
const blankLineBefore = content.lastIndexOf('\r\n\r\n', viewCharsIdx);
const blockStartIdx = blankLineBefore + 2; // Skip the \r\n to start at the beginning of the line

console.log('Block start index:', blockStartIdx, 'Block end index:', blockEndIdx);
console.log('Block content preview:', JSON.stringify(content.substring(blockStartIdx, blockStartIdx + 100)));

// Build new block
const equals = '\u2550';
const newBlock = [
    `          <!-- ${equals.repeat(46)}`,
    `               VIEW: CHARTS`,
    `          ${equals.repeat(50)} -->`,
    `          <template v-else-if="currentView === 'charts'">`,
    `            <ChartsView`,
    `              :scans="data.scans.value"`,
    `              :done-scans="doneScans"`,
    `              :monitors="data.monitors"`,
    `              :avg-score="avgScore"`,
    `              :url-sparklines="data.urlSparklines"`,
    `              :top-sites="topSites"`,
    `              :url-charts="urlCharts"`,
    `              :open-scan-by-url="view.openScanByUrl"`,
    `              @open-chart-detail="view.openChartDetail"`,
    `            />`,
    `          </template>`,
].join('\r\n');

// Replace
const newContent = content.substring(0, blockStartIdx) + newBlock + content.substring(blockEndIdx);

fs.writeFileSync('app/pages/dashboard/index.vue', newContent, 'utf-8');
console.log('Done: ChartsView component extracted successfully');