import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from './ChatManager.js';

test('calculate() supports basic arithmetic expressions', () => {
  assert.equal(calculate({ expression: '2 + 3 * 4' }), 14);
  assert.equal(calculate({ expression: '(10 + 5) / 3' }), 5);
  assert.equal(calculate({ expression: '7 % 3' }), 1);
});

test('calculate() rejects unsafe input', () => {
  assert.throws(() => calculate({ expression: 'process.env' }), /unsafe/i);
  assert.throws(() => calculate({ expression: '1; process.exit(1)' }), /unsafe/i);
});

test('ChatManager keeps conversation memory for the same role', async () => {
  const manager = new (await import('./ChatManager.js')).ChatManager('fake-key');
  manager.client = {
    chat: {
      completions: {
        create: async ({ messages }) => ({
          choices: [{ message: { content: `echo:${messages[messages.length - 1].content}` } }],
        }),
      },
    },
  };

  const first = await manager.chat('你好', 'nightMarketExpert');
  const second = await manager.chat('我叫小明', 'nightMarketExpert');

  assert.equal(first, 'echo:你好');
  assert.equal(second, 'echo:我叫小明');
  assert.equal(manager.conversationHistory.get('nightMarketExpert').length, 4);
});

test('weather tools expose current time and weather information', async () => {
  const { getCurrentTime, getWeather } = await import('./ChatManager.js');

  const time = getCurrentTime();
  assert.match(time, /\d{4}-\d{2}-\d{2}/);

  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      name: 'Taipei',
      sys: { country: 'TW' },
      main: { temp: 28, feels_like: 30, humidity: 70 },
      weather: [{ description: '晴朗', icon: '01d' }],
    }),
  });

  try {
    const weather = await getWeather({ city: 'Taipei' });
    assert.equal(weather.city, 'Taipei');
    assert.equal(weather.temperature, 28);
    assert.equal(weather.description, '晴朗');
  } finally {
    global.fetch = originalFetch;
  }
});
