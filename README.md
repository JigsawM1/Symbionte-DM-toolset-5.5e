
# TaleSpire Symbiote Base with Vite + React

This project serves as a base for creating Symbiotes for TaleSpire using Vite and React. It provides a streamlined setup to get you started quickly.

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed on your machine. If not, download and install them from [Node.js official site](https://nodejs.org/).

### Project Setup

This project was set up using the command:

```sh
npm create vite@latest . --template react
```

If you're picking up this project, follow these steps to get started:

1. **Clone the Repository:**

   ```sh
   git clone https://github.com/PanoramicPanda/vite-react-symbiote.git
   cd vite-react-symbiote
   ```

2. **Install Dependencies:**

   ```sh
   npm install
   ```

### Development

To start the development server:

```sh
npm run dev
```

The development environment is configured to match the Symbiote's width (599px) for accurate styling and layout.

### Building for Mod.io

To build and zip the project for upload on Mod.io:

1. **Update Symbiote Name:**

   Ensure you update the `buildFolder` variable in the `build_folder_name.json` to match your Symbiote's folder name.

2. **Run Build and Zip Script:**

```sh
npm run build-and-zip
```

This will create a `mod-io-build` folder containing the production build of your Symbiote, along with zipping it up in an appropriately named zip for upload.

### Deployment

Running the deploy_to_ts script will copy the build to the default locally installed Symbiotes folder based on your OS.

1. **Update Symbiote Name:**

   Ensure you update the `buildFolder` variable in the `build_folder_name.json` to match your Symbiote's folder name.

2. **Run Deploy Script:**

   ```sh
   npm run deploy
   ```

For more information on Symbiote installation paths, refer to the [Symbiote installation documentation](https://symbiote-docs.talespire.com/#installing).

### Manifest Configuration

The `manifest.json` file located in the `public` folder includes basic configuration for your Symbiote, such as name, website, and authors.

**Note:** This manifest does not include the TaleSpire API hooks. For detailed documentation on the manifest configuration, visit [Symbiote Manifest Documentation](https://symbiote-docs.talespire.com/manifest_doc_v1.html).

### Ensuring Listener Functions Are Not Minified

When working with functions that are intended to be listeners on subscriptions in your project, it's crucial to ensure these functions are not minified during the build process. This ensures that their names remain intact and can be correctly referenced.
Steps to Prevent Minification

#### Update vite.config.js:
   
   Configure Vite to use Terser and specify the functions you want to keep non-minified. Add the following configuration to your vite.config.js:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
   plugins: [react()],
   build: {
      minify: 'terser',
      terserOptions: {
         keep_fnames: /oneFunctionNameToKeep|otherFunctionNamesToKeep/
      }
   }
});
```

In the terserOptions, replace otherFunctionNamesToKeep with any other function names you want to keep non-minified.

### Notes

- The project uses JavaScript (JS) instead of TypeScript (TS).
- SVG files are not supported in Symbiotes; please use PNG files instead.
- Update your project name in the `package.json` file.

## Helpful Links

- [TaleSpire Symbiote Documentation](https://symbiote-docs.talespire.com/)
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://reactjs.org/)

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


---

By following the above steps, you should be able to set up, develop, and deploy your TaleSpire Symbiote efficiently. If you encounter any issues or have questions, refer to the provided documentation links for more detailed information.
