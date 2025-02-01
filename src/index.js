'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create(
        (typeof Iterator === 'function' ? Iterator : Object).prototype,
      );
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
Object.defineProperty(exports, '__esModule', { value: true });
var dayjs = require('dayjs');
var discord_js_1 = require('discord.js');
var fs_1 = require('fs');
var path_1 = require('path');
process.on('uncaughtException', function (error) {
  var _a;
  if (
    error instanceof Error &&
    error.message.includes("undefined (reading 'vi')")
  ) {
    var stackLines =
      (_a = error.stack) === null || _a === void 0 ? void 0 : _a.split('\n');
    var relevantLine =
      stackLines === null || stackLines === void 0
        ? void 0
        : stackLines.find(function (line) {
            return line.includes('E:\\Downloads\\Project\\wumps\\src\\slash');
          });
    console.log('Uncaught Exception: Translation not found');
    console.log(relevantLine);
  } else if (error instanceof discord_js_1.DiscordAPIError) {
    if (error.code === 'ENOTFOUND') {
      console.log('No internet connection');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Connection refused');
    } else if (error.code === 10062) {
      console.log(
        'Unknown Interaction. Time stamp: ',
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
      );
    } else if (error.code === 10008) {
      console.log(
        'Message is deleted. Time stamp: ',
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
      );
    } else {
      console.log(
        'Uncaught Exception: Discord API Error. Error: ',
        error.message,
      );
    }
  } else {
    console.error('Uncaught Exception: Unknown error: ', error);
  }
});
var client = new discord_js_1.Client({
  intents: [
    discord_js_1.GatewayIntentBits.Guilds,
    discord_js_1.GatewayIntentBits.GuildMessages,
    discord_js_1.GatewayIntentBits.MessageContent,
    discord_js_1.GatewayIntentBits.GuildMembers,
  ],
});
client.slashCommands = new discord_js_1.Collection();
client.commands = new discord_js_1.Collection();
client.cooldowns = new discord_js_1.Collection();
client.chats = new discord_js_1.Collection();
var handlersDir = (0, path_1.join)(__dirname, './handlers');
(0, fs_1.readdirSync)(handlersDir).forEach(function (handler) {
  require(''.concat(handlersDir, '/').concat(handler))(client);
});
client.login(process.env['DiSCORD_TOKEN']).then(function () {
  return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
      return [2 /*return*/];
    });
  });
});
