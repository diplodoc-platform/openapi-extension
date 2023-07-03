import {OpenapiMDSection} from '../../typings';
import {extractText} from '../clear';

export type Table = string[][];


export function parseTable(section: OpenapiMDSection): Table {
    const tableStart = section.findIndex((line) => line.startsWith('#|||'));
    const header = section[tableStart].slice(1).split('|').map(extractText).filter(Boolean);
    const table: Table = [header];
    let index = tableStart + 1;

    while (index < section.length && section[index].startsWith('||')) {
        table.push(section[index].split('|').map(extractText).filter(Boolean));
        index++;
    }

    return table;
}
