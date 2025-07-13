import {
  createHashRouter,
} from "react-router";

import LandingPage from "../Landing";
import PDFCropper from "../components/Crop";
import { PATH } from "./path";

let router = createHashRouter([
  {
    path: "",
    Component: LandingPage,
  },
  {
    path: PATH.crop,
    Component: PDFCropper
  }
]);

export default router