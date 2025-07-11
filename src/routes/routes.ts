import {
  createBrowserRouter,
  RouterProvider,
} from "react-router";

import LandingPage from "../Landing";
import PDFCropper from "../components/Crop";

let router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/crop",
    Component: PDFCropper
  }
]);

export default router