import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonDetailRoutingModule } from './pokemon-detail-routing.module';

import { PokemonDetailComponent } from './pokemon-detail.component';

@NgModule({
  declarations: [PokemonDetailComponent],
  imports: [
    CommonModule,
    PokemonDetailRoutingModule
  ]
})
export class PokemonDetailModule { }
