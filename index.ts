#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { faker, Faker, fakerEN } from '@faker-js/faker';
import chalk from 'chalk';

// Add type definitions
type FieldDefinition = {
  name: string;
  type: string;
  options?: Record<string, any>;
};

// Create locale-specific faker instances
const createLocaleFaker = (locale: string): Faker => {
  // For now, we'll use English as the default locale since locale support needs more setup
  return fakerEN;
};

// Define the mock data generation tools
const MOCK_DATA_TOOLS: Tool[] = [
  {
    name: "generateCustomData",
    description: `Generates mock data based on custom field definitions.
    
    Parameters:
    - locale: The locale to use for generating data (e.g., "en", "es", "fr")
    - fields: Array of field definitions, each containing:
      - name: Name of the field
      - type: Type of data to generate
      - options: Optional parameters for data generation
    
    Available types:
    Person:
    - "firstName" | "lastName" | "fullName" | "gender" | "prefix" | "suffix" | "jobTitle" | "jobType" | "jobArea"
    
    Internet:
    - "email" | "userName" | "password" | "url" | "ipAddress" | "domainName" | "protocol" | "httpMethod"
    
    Location:
    - "address" | "city" | "country" | "countryCode" | "zipCode" | "state" | "stateAbbr" | "latitude" | "longitude" | "timeZone"
    
    Date/Time:
    - "date" (options: past, future, between) | "weekday" | "month" | "timestamp"
    
    Commerce:
    - "product" | "productName" | "price" (options: min, max) | "department" | "productMaterial" | "productDescription"
    
    Company:
    - "companyName" | "catchPhrase" | "bs" | "bsAdjective" | "bsBuzz" | "bsNoun"
    
    Finance:
    - "accountNumber" | "accountName" | "amount" | "currencyCode" | "currencyName" | "currencySymbol" | "bitcoinAddress"
    
    Vehicle:
    - "vehicle" | "manufacturer" | "model" | "type" | "fuel" | "vin" | "color"
    
    System:
    - "fileName" | "mimeType" | "fileExt" | "directoryPath" | "semver"
    
    Science:
    - "chemicalElement" | "unit" | "scientificUnit"
    
    Music:
    - "genre" | "songName" | "artist"
    
    Primitive Types:
    - "number" (options: min, max) | "float" (options: min, max, precision)
    - "word" | "words" | "sentence" | "paragraph" | "text"
    - "uuid" | "boolean"
    - "color" (options: format: 'hex'|'rgb')
    `,
    inputSchema: {
      type: "object",
      properties: {
        locale: {
          type: "string",
          description: "Locale for generating data",
          default: "en"
        },
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the field"
              },
              type: {
                type: "string",
                description: "Type of data to generate"
              },
              options: {
                type: "object",
                description: "Optional parameters for data generation",
                additionalProperties: true
              }
            },
            required: ["name", "type"]
          },
          description: "Field definitions for data generation"
        }
      },
      required: ["fields"]
    }
  },
  {
    name: "generatePerson",
    description: `Generates mock person data including name, email, address, etc.
    
    Parameters:
    - locale: The locale to use for generating data (e.g., "en", "es", "fr")
    - fields: Array of fields to include in the generated data
      Available fields: firstName, lastName, email, phone, address, dateOfBirth
    `,
    inputSchema: {
      type: "object",
      properties: {
        locale: {
          type: "string",
          description: "Locale for generating data",
          default: "en"
        },
        fields: {
          type: "array",
          items: {
            type: "string",
            enum: ["firstName", "lastName", "email", "phone", "address", "dateOfBirth"]
          },
          description: "Fields to include in the generated data"
        }
      },
      required: ["fields"]
    }
  },
  {
    name: "generateCompany",
    description: `Generates mock company data including name, industry, address, etc.
    
    Parameters:
    - locale: The locale to use for generating data
    - fields: Array of fields to include in the generated data
      Available fields: name, industry, catchPhrase, address, phone
    `,
    inputSchema: {
      type: "object",
      properties: {
        locale: {
          type: "string",
          description: "Locale for generating data",
          default: "en"
        },
        fields: {
          type: "array",
          items: {
            type: "string",
            enum: ["name", "industry", "catchPhrase", "address", "phone"]
          },
          description: "Fields to include in the generated data"
        }
      },
      required: ["fields"]
    }
  }
];

class MockDataServer {
  private generateCustomData(locale: string, fields: FieldDefinition[]) {
    const data: Record<string, any> = {};
    const localeFaker = createLocaleFaker(locale);

    fields.forEach(field => {
      const { name, type, options = {} } = field;
      
      try {
        switch (type) {
          case "firstName":
            data[name] = localeFaker.person.firstName();
            break;
          case "lastName":
            data[name] = localeFaker.person.lastName();
            break;
          case "fullName":
            data[name] = localeFaker.person.fullName();
            break;
          case "email":
            data[name] = localeFaker.internet.email();
            break;
          case "phone":
            data[name] = localeFaker.phone.number();
            break;
          case "number":
            data[name] = localeFaker.number.int({
              min: options.min || 0,
              max: options.max || 1000
            });
            break;
          case "date":
            if (options.past) {
              data[name] = localeFaker.date.past().toISOString();
            } else if (options.future) {
              data[name] = localeFaker.date.future().toISOString();
            } else {
              data[name] = localeFaker.date.recent().toISOString();
            }
            break;
          case "address":
            data[name] = localeFaker.location.streetAddress();
            break;
          case "city":
            data[name] = localeFaker.location.city();
            break;
          case "country":
            data[name] = localeFaker.location.country();
            break;
          case "zipCode":
            data[name] = localeFaker.location.zipCode();
            break;
          case "word":
            data[name] = localeFaker.word.sample();
            break;
          case "sentence":
            data[name] = localeFaker.lorem.sentence();
            break;
          case "paragraph":
            data[name] = localeFaker.lorem.paragraph();
            break;
          case "uuid":
            data[name] = localeFaker.string.uuid();
            break;
          case "boolean":
            data[name] = localeFaker.datatype.boolean();
            break;
          case "url":
            data[name] = localeFaker.internet.url();
            break;
          case "ipAddress":
            data[name] = localeFaker.internet.ip();
            break;
          case "color":
            data[name] = options.format === 'rgb' 
              ? `rgb(${localeFaker.number.int({ min: 0, max: 255 })}, ${localeFaker.number.int({ min: 0, max: 255 })}, ${localeFaker.number.int({ min: 0, max: 255 })})`
              : `#${localeFaker.string.hexadecimal({ length: 6 }).substring(2)}`;
            break;
          case "gender":
            data[name] = localeFaker.person.gender();
            break;
          case "prefix":
            data[name] = localeFaker.person.prefix();
            break;
          case "suffix":
            data[name] = localeFaker.person.suffix();
            break;
          case "jobTitle":
            data[name] = localeFaker.person.jobTitle();
            break;
          case "jobType":
            data[name] = localeFaker.person.jobType();
            break;
          case "jobArea":
            data[name] = localeFaker.person.jobArea();
            break;
          case "userName":
            data[name] = localeFaker.internet.userName();
            break;
          case "password":
            data[name] = localeFaker.internet.password();
            break;
          case "domainName":
            data[name] = localeFaker.internet.domainName();
            break;
          case "protocol":
            data[name] = localeFaker.internet.protocol();
            break;
          case "httpMethod":
            data[name] = localeFaker.internet.httpMethod();
            break;
          case "countryCode":
            data[name] = localeFaker.location.countryCode();
            break;
          case "state":
            data[name] = localeFaker.location.state();
            break;
          case "stateAbbr":
            data[name] = localeFaker.location.state({ abbreviated: true });
            break;
          case "latitude":
            data[name] = localeFaker.location.latitude();
            break;
          case "longitude":
            data[name] = localeFaker.location.longitude();
            break;
          case "timeZone":
            data[name] = localeFaker.location.timeZone();
            break;
          case "weekday":
            data[name] = localeFaker.date.weekday();
            break;
          case "month":
            data[name] = localeFaker.date.month();
            break;
          case "timestamp":
            data[name] = localeFaker.date.anytime().getTime();
            break;
          case "product":
            data[name] = localeFaker.commerce.product();
            break;
          case "productName":
            data[name] = localeFaker.commerce.productName();
            break;
          case "price":
            data[name] = localeFaker.commerce.price({
              min: options.min || 1,
              max: options.max || 1000,
            });
            break;
          case "department":
            data[name] = localeFaker.commerce.department();
            break;
          case "productMaterial":
            data[name] = localeFaker.commerce.productMaterial();
            break;
          case "productDescription":
            data[name] = localeFaker.commerce.productDescription();
            break;
          case "companyName":
            data[name] = localeFaker.company.name();
            break;
          case "catchPhrase":
            data[name] = localeFaker.company.catchPhrase();
            break;
          case "bs":
            data[name] = localeFaker.company.buzzPhrase();
            break;
          case "bsAdjective":
            data[name] = localeFaker.company.buzzAdjective();
            break;
          case "bsBuzz":
            data[name] = localeFaker.company.buzzVerb();
            break;
          case "bsNoun":
            data[name] = localeFaker.company.buzzNoun();
            break;
          case "accountNumber":
            data[name] = localeFaker.finance.accountNumber();
            break;
          case "accountName":
            data[name] = localeFaker.finance.accountName();
            break;
          case "amount":
            data[name] = localeFaker.finance.amount();
            break;
          case "currencyCode":
            data[name] = localeFaker.finance.currencyCode();
            break;
          case "currencyName":
            data[name] = localeFaker.finance.currencyName();
            break;
          case "currencySymbol":
            data[name] = localeFaker.finance.currencySymbol();
            break;
          case "bitcoinAddress":
            data[name] = localeFaker.finance.bitcoinAddress();
            break;
          case "vehicle":
            data[name] = localeFaker.vehicle.vehicle();
            break;
          case "manufacturer":
            data[name] = localeFaker.vehicle.manufacturer();
            break;
          case "model":
            data[name] = localeFaker.vehicle.model();
            break;
          case "type":
            data[name] = localeFaker.vehicle.type();
            break;
          case "fuel":
            data[name] = localeFaker.vehicle.fuel();
            break;
          case "vin":
            data[name] = localeFaker.vehicle.vin();
            break;
          case "fileName":
            data[name] = localeFaker.system.fileName();
            break;
          case "mimeType":
            data[name] = localeFaker.system.mimeType();
            break;
          case "fileExt":
            data[name] = localeFaker.system.fileExt();
            break;
          case "directoryPath":
            data[name] = localeFaker.system.directoryPath();
            break;
          case "semver":
            data[name] = localeFaker.system.semver();
            break;
          case "chemicalElement":
            data[name] = localeFaker.science.chemicalElement();
            break;
          case "unit":
            data[name] = localeFaker.science.unit();
            break;
          case "scientificUnit":
            data[name] = localeFaker.science.unit();
            break;
          case "genre":
            data[name] = localeFaker.music.genre();
            break;
          case "songName":
            data[name] = localeFaker.music.songName();
            break;
          case "artist":
            data[name] = localeFaker.music.artist();
            break;
          case "float":
            data[name] = localeFaker.number.float({
              min: options.min || 0,
              max: options.max || 1000,
              fractionDigits: options.precision || 2
            });
            break;
          case "words":
            data[name] = localeFaker.word.words();
            break;
          case "text":
            data[name] = localeFaker.lorem.text();
            break;
          default:
            throw new Error(`Unsupported field type: ${type}`);
        }
      } catch (error) {
        console.error(chalk.yellow(`Error generating field ${name}: ${error}`));
        data[name] = null;
      }
    });

    return data;
  }

  private generatePersonData(locale: string, fields: string[]) {
    const data: Record<string, any> = {};
    const localeFaker = createLocaleFaker(locale);

    fields.forEach(field => {
      switch (field) {
        case "firstName":
          data.firstName = localeFaker.person.firstName();
          break;
        case "lastName":
          data.lastName = localeFaker.person.lastName();
          break;
        case "email":
          data.email = localeFaker.internet.email();
          break;
        case "phone":
          data.phone = localeFaker.phone.number();
          break;
        case "address":
          data.address = {
            street: localeFaker.location.streetAddress(),
            city: localeFaker.location.city(),
            state: localeFaker.location.state(),
            country: localeFaker.location.country(),
            zipCode: localeFaker.location.zipCode()
          };
          break;
        case "dateOfBirth":
          data.dateOfBirth = localeFaker.date.past({ years: 70 }).toISOString();
          break;
      }
    });

    return data;
  }

  private generateCompanyData(locale: string, fields: string[]) {
    const data: Record<string, any> = {};
    const localeFaker = createLocaleFaker(locale);

    fields.forEach(field => {
      switch (field) {
        case "name":
          data.name = localeFaker.company.name();
          break;
        case "industry":
          data.industry = localeFaker.company.buzzPhrase();
          break;
        case "catchPhrase":
          data.catchPhrase = localeFaker.company.catchPhrase();
          break;
        case "address":
          data.address = {
            street: localeFaker.location.streetAddress(),
            city: localeFaker.location.city(),
            state: localeFaker.location.state(),
            country: localeFaker.location.country(),
            zipCode: localeFaker.location.zipCode()
          };
          break;
        case "phone":
          data.phone = localeFaker.phone.number();
          break;
      }
    });

    return data;
  }

  public processRequest(toolName: string, args: any): { content: Array<{ type: string; text: string }>; isError?: boolean } {
    try {
      let result;
      const locale = args.locale || "en";

      switch (toolName) {
        case "generateCustomData":
          result = this.generateCustomData(locale, args.fields);
          break;
        case "generatePerson":
          result = this.generatePersonData(locale, args.fields);
          break;
        case "generateCompany":
          result = this.generateCompanyData(locale, args.fields);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      console.error(chalk.green(`Generated ${toolName} data successfully`));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      console.error(chalk.red(`Error generating mock data: ${error}`));
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            status: 'failed'
          }, null, 2)
        }],
        isError: true
      };
    }
  }
}

const server = new Server(
  {
    name: "mock-data-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const mockDataServer = new MockDataServer();

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MOCK_DATA_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  return mockDataServer.processRequest(request.params.name, request.params.arguments);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(chalk.blue("Mock Data MCP Server running on stdio"));
}

runServer().catch((error) => {
  console.error(chalk.red("Fatal error running server:", error));
  process.exit(1);
}); 