import { AppError } from "../../../../shared/errors/AppError";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";

let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;
let usersRepository: IUsersRepository;

describe("Auhenticate User", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);

    const user = await createUserUseCase.execute({
      email: "white@angel.com.br",
      name: "white",
      password: "123456",
    });
  });

  //return user login

  it("should return user login", async () => {
    const login = await authenticateUserUseCase.execute({
      email: "white@angel.com.br",
      password: "123456",
    });

    expect(login).toHaveProperty("token");
  });

  //return error if password is invalid

  it("should return error if password is invalid", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "white@angel.com.br",
        password: "1234567",
      });
    }).rejects.toBeInstanceOf(AppError);
  });

  //return error if email is invalid

  it("should return error if password is invalid", async () => {
    expect(async () => {
      await authenticateUserUseCase.execute({
        email: "white@angelico.com.br",
        password: "123456",
      });
    }).rejects.toBeInstanceOf(AppError);
  });
});
