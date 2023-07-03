import {parseTable} from '../__helpers__/validators/elements/table';
import {splitBySections} from '../__helpers__/validators/splitBySections';
import {fs} from '../__helpers__/virtualFS';
import {runPreset} from './mocks/run';

describe('basci openapi project', () => {
    afterEach(() => {
        fs.reset();
    });
    it('starts project', async () => {
        await runPreset('basic');

        const basic = fs.match('basic.md');
        const sections = splitBySections(basic);


    }, 20_000);
});
