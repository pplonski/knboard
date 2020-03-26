import React from "react";
import { screen, fireEvent, wait } from "@testing-library/react";
import BoardList from "./BoardList";
import axios from "axios";
import { renderWithRedux, rootInitialState } from "utils/testHelpers";
import { fetchAllBoards } from "./BoardSlice";
import { API_BOARDS } from "api";
import boardReducer from "features/board/BoardSlice";
import MockAdapter from "axios-mock-adapter";

const axiosMock = new MockAdapter(axios);

const boards = [{ id: 1, name: "Internals" }];

beforeEach(() => {
  axiosMock.reset();
});

it("should fetch and render board list", async () => {
  axiosMock.onGet(API_BOARDS).reply(200, boards);
  const { mockStore } = renderWithRedux(<BoardList />, {
    ...rootInitialState,
    board: { ...rootInitialState.board, entities: boards }
  });

  expect(screen.getByText(/My boards/i)).toBeVisible();
  expect(screen.getByText(/Create new board/i)).toBeVisible();

  await wait(() => screen.getByText("Internals"));

  expect(screen.queryAllByTestId("fade")).toHaveLength(0);
  fireEvent.mouseOver(screen.getByText("Internals"));
  expect(screen.queryAllByTestId("fade")).toHaveLength(1);
  fireEvent.mouseLeave(screen.getByText("Internals"));
  expect(screen.queryAllByTestId("fade")).toHaveLength(0);

  const actions = mockStore.getActions();
  expect(actions[0].type).toEqual(fetchAllBoards.pending.type);
  expect(actions[1].type).toEqual(fetchAllBoards.fulfilled.type);
  expect(actions[1].payload).toEqual(boards);
});

it("should handle failure to fetch boards", async () => {
  axiosMock.onGet(API_BOARDS).networkErrorOnce();
  const { mockStore } = renderWithRedux(<BoardList />);

  // failure is not dispatched yet
  expect(mockStore.getActions()[0].type).toEqual(fetchAllBoards.pending.type);
});

it("should set loading start on start", () => {
  expect(
    boardReducer(
      { ...rootInitialState.board, fetchLoading: false },
      fetchAllBoards.pending
    )
  ).toEqual({ ...rootInitialState.board, fetchLoading: true });
});

it("should set boards on success", () => {
  const boards = [{ id: 1, name: "Internals" }];
  expect(
    boardReducer(
      { ...rootInitialState.board, fetchLoading: true, entities: [] },
      { type: fetchAllBoards.fulfilled, payload: boards }
    )
  ).toEqual({
    ...rootInitialState.board,
    fetchLoading: false,
    entities: boards
  });
});

it("should set error on fail", () => {
  const errorMsg = "Failed to fetch boards.";
  expect(
    boardReducer(
      { ...rootInitialState.board, fetchLoading: true, fetchError: null },
      { type: fetchAllBoards.rejected, payload: errorMsg }
    )
  ).toEqual({
    ...rootInitialState.board,
    fetchLoading: false,
    fetchError: errorMsg
  });
});
