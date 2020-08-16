import { Component, HostBinding, OnInit } from '@angular/core';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiResult, PokemonService } from '../services/pokemon.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public pokemonSvc: PokemonService) {}

  @HostBinding('class.fixed-content-container') true;

  pokemonListError: boolean;
  pokemonList$: Observable<ApiResult[]>;

  typeError: boolean;
  types$: Observable<ApiResult[]>;

  ngOnInit(): void {
    this.getTypes();
    this.getPokemonList();
  }

  getTypes(): void {
    this.typeError = false;

    this.types$ = this.pokemonSvc.types$.pipe(
      catchError(error => {
        console.error(error);
        this.typeError = true;
        return throwError('There was an issue getting types.');
      })
    );
  }

  getPokemonList(): void {
    this.pokemonListError = false;

    this.pokemonList$ = this.pokemonSvc.pokemonList$.pipe(
      catchError(error => {
        console.error(error);
        this.pokemonListError = true;
        return throwError('There was an issue getting pokemon.');
      })
    );
  }

}
