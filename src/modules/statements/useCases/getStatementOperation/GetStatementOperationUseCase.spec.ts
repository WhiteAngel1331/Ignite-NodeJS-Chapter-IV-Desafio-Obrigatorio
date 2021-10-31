import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { AuthenticateUserUseCase } from "../../../users/useCases/authenticateUser/AuthenticateUserUseCase";
import { CreateUserUseCase } from "../../../users/useCases/createUser/CreateUserUseCase";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepository: IUsersRepository;
let statementRepository: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

enum OperationType {
  DEPOSIT = "deposit",
  WITHDRAW = "withdraw",
}

describe("Create Statement", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementRepository = new InMemoryStatementsRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementRepository
    );
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      usersRepository,
      statementRepository
    );

    await createUserUseCase.execute({
      email: "white@angel.com.br",
      name: "white",
      password: "123456",
    });
  });

  it("cannot get statement operation if user is not authenticated", async () => {
    expect(async () => {
      const session = await authenticateUserUseCase.execute({
        email: "white@angel.com.br",
        password: "1234569",
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  it("Should be able to get balance", async () => {
    const session = await authenticateUserUseCase.execute({
      email: "white@angel.com.br",
      password: "123456",
    });

    await createStatementUseCase.execute({
      amount: 100,
      description: "test",
      type: "deposit" as OperationType,
      user_id: session.user.id as string,
    });

    await createStatementUseCase.execute({
      amount: 10,
      description: "test",
      type: "withdraw" as OperationType,
      user_id: session.user.id as string,
    });

    const statement = await createStatementUseCase.execute({
      amount: 30,
      description: "test",
      type: "withdraw" as OperationType,
      user_id: session.user.id as string,
    });

    const statementOperation = await getStatementOperationUseCase.execute({
      statement_id: statement.id as string,
      user_id: session.user.id as string,
    });

    expect(statementOperation.amount).toBe(30);
    expect(statementOperation.description).toBe("test");
    expect(statementOperation.type).toBe("withdraw");
  });

  //not found a statement if id is invalid

  it("cannot found a statemant operation if id is invalid", async () => {
    const session = await authenticateUserUseCase.execute({
      email: "white@angel.com.br",
      password: "123456",
    });

    const statement = await createStatementUseCase.execute({
      amount: 100,
      description: "test",
      type: "deposit" as OperationType,
      user_id: session.user.id as string,
    });

    expect(async () => {
      await getStatementOperationUseCase.execute({
        statement_id: "invalid_id",
        user_id: session.user.id as string,
      });
    }).rejects.toBeInstanceOf(AppError);
  });
});
