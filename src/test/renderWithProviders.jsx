import { configureStore } from "@reduxjs/toolkit";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";

const defaultState = {
  auth: {
    user: null,
  },
};

const createStore = (preloadedState = defaultState) =>
  configureStore({
    reducer: {
      auth: (state = preloadedState.auth) => state,
    },
    preloadedState,
  });

export const renderWithProviders = (
  ui,
  { route = "/", preloadedState = defaultState } = {}
) =>
  render(
    <Provider store={createStore(preloadedState)}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>
  );
