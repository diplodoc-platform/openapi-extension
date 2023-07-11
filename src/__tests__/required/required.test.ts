import {fs} from '../__helpers__/virtualFS';
import {runPreset} from '../run';

describe('description', () => {
    beforeEach(async () => {
        fs.reset();
    });

    it('renders correct description', async () => {
        await runPreset(__dirname);

        const page = fs.match('description.md');

        expect(page).toMatchSnapshot();
    });

});
