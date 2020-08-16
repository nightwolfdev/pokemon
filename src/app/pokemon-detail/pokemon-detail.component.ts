import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Pokemon, PokemonService } from '../services/pokemon.service';

@Component({
  selector: 'app-pokemon-detail',
  templateUrl: './pokemon-detail.component.html',
  styleUrls: ['./pokemon-detail.component.scss']
})
export class PokemonDetailComponent implements OnInit {

  constructor(
    public pokemonSvc: PokemonService,
    private route: ActivatedRoute
  ) { }

  notFound: boolean;
  pokemonError: boolean;
  pokemon$: Observable<Pokemon>;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.pokemonSvc.changePokemon(params.get('name'));

      this.getPokemon();
    });
  }

  getPokemon(): void {
    this.notFound = false;
    this.pokemonError = false;

    this.pokemon$ = this.pokemonSvc.pokemon$.pipe(
      catchError(error => {
        console.error(error);

        if (error.status === 404) {
          this.notFound = true;
        } else {
          this.pokemonError = true;
        }

        return throwError('There was an issue getting pokemon.');
      })
    );
  }

}
